from fastapi import FastAPI, Request, HTTPException
from services import (
    convert_base64_to_file,
    transcribe_audio,
    send_message_to_whatsapp,
    get_audio_base64,
    summarize_text_if_needed,
    download_remote_audio,
)
from models import WebhookRequest
from config import logger, settings, redis_client
from storage import StorageHandler
import traceback
import os
import asyncio
import aiohttp

app = FastAPI()
storage = StorageHandler()
@app.on_event("startup")
async def startup_event():
    api_domain = os.getenv("API_DOMAIN", "seu.dominio.com")
    redis_client.set("API_DOMAIN", api_domain)
# Função para buscar configurações do Redis com fallback para valores padrão
def get_config(key, default=None):
    try:
        value = redis_client.get(key)
        if value is None:
            logger.warning(f"Configuração '{key}' não encontrada no Redis. Usando padrão: {default}")
            return default
        return value
    except Exception as e:
        logger.error(f"Erro ao acessar Redis: {e}")
        return default

# Carregando configurações dinâmicas do Redis
def load_dynamic_settings():
    return {
        "GROQ_API_KEY": get_config("GROQ_API_KEY", "default_key"),
        "BUSINESS_MESSAGE": get_config("BUSINESS_MESSAGE", "*Impacte AI* Premium Services"),
        "PROCESS_GROUP_MESSAGES": get_config("PROCESS_GROUP_MESSAGES", "false") == "true",
        "PROCESS_SELF_MESSAGES": get_config("PROCESS_SELF_MESSAGES", "true") == "true",
        "DEBUG_MODE": get_config("DEBUG_MODE", "false") == "true",
    }

async def forward_to_webhooks(body: dict, storage: StorageHandler):
    """Encaminha o payload para todos os webhooks cadastrados."""
    webhooks = storage.get_webhook_redirects()
    
    async with aiohttp.ClientSession() as session:
        for webhook in webhooks:
            try:
                # Configura os headers mantendo o payload intacto
                headers = {
                    "Content-Type": "application/json",
                    "X-TranscreveZAP-Forward": "true",  # Header para identificação da origem
                    "X-TranscreveZAP-Webhook-ID": webhook["id"]
                }
                
                async with session.post(
                    webhook["url"],
                    json=body,  # Envia o payload original sem modificações
                    headers=headers,
                    timeout=10
                ) as response:
                    if response.status in [200, 201, 202]:
                        storage.update_webhook_stats(webhook["id"], True)
                    else:
                        error_text = await response.text()
                        storage.update_webhook_stats(
                            webhook["id"],
                            False,
                            f"Status {response.status}: {error_text}"
                        )
                        # Registra falha para retry posterior
                        storage.add_failed_delivery(webhook["id"], body)
            except Exception as e:
                storage.update_webhook_stats(
                    webhook["id"],
                    False,
                    f"Erro ao encaminhar: {str(e)}"
                )
                # Registra falha para retry posterior
                storage.add_failed_delivery(webhook["id"], body)

@app.post("/transcreve-audios")
async def transcreve_audios(request: Request):
    try:
        body = await request.json()
        dynamic_settings = load_dynamic_settings()
        # Iniciar o encaminhamento em background
        asyncio.create_task(forward_to_webhooks(body, storage))
        # Log inicial da requisição
        storage.add_log("INFO", "Nova requisição de transcrição recebida", {
            "instance": body.get("instance"),
            "event": body.get("event")
        })

        if dynamic_settings["DEBUG_MODE"]:
            storage.add_log("DEBUG", "Payload completo recebido", {
                "body": body
            })

        # Extraindo informações
        server_url = body["server_url"]
        instance = body["instance"]
        apikey = body["apikey"]
        audio_key = body["data"]["key"]["id"]
        from_me = body["data"]["key"]["fromMe"]
        remote_jid = body["data"]["key"]["remoteJid"]
        message_type = body["data"]["messageType"]

        # Verificação de tipo de mensagem
        if "audioMessage" not in message_type:
            storage.add_log("INFO", "Mensagem ignorada - não é áudio", {
                "message_type": message_type,
                "remote_jid": remote_jid
            })
            return {"message": "Mensagem recebida não é um áudio"}

        # Verificação de permissões
        if not storage.can_process_message(remote_jid):
            is_group = "@g.us" in remote_jid
            storage.add_log("INFO", 
                "Mensagem não autorizada para processamento",
                {
                    "remote_jid": remote_jid,
                    "tipo": "grupo" if is_group else "usuário",
                    "motivo": "grupo não permitido" if is_group else "usuário bloqueado"
                }
            )
            return {"message": "Mensagem não autorizada para processamento"}

        # Verificação do modo de processamento (grupos/todos)
        process_mode = storage.get_process_mode()
        is_group = "@g.us" in remote_jid
        
        if process_mode == "groups_only" and not is_group:
            storage.add_log("INFO", "Mensagem ignorada - modo apenas grupos ativo", {
                "remote_jid": remote_jid,
                "process_mode": process_mode,
                "is_group": is_group
            })
            return {"message": "Modo apenas grupos ativo - mensagens privadas ignoradas"}

        if from_me and not dynamic_settings["PROCESS_SELF_MESSAGES"]:
            storage.add_log("INFO", "Mensagem própria ignorada", {
                "remote_jid": remote_jid
            })
            return {"message": "Mensagem enviada por mim, sem operação"}

        # Obter áudio
        try:
            if "mediaUrl" in body["data"]["message"]:
                media_url = body["data"]["message"]["mediaUrl"]
                storage.add_log("DEBUG", "Baixando áudio via URL", {"mediaUrl": media_url})
                audio_source = await download_remote_audio(media_url)   # Baixa o arquivo remoto e retorna o caminho local
            else:
                storage.add_log("DEBUG", "Obtendo áudio via base64")
                base64_audio = await get_audio_base64(server_url, instance, apikey, audio_key)
                audio_source = await convert_base64_to_file(base64_audio)
                storage.add_log("DEBUG", "Áudio convertido", {"source": audio_source})

            # Carregar configurações de formatação
            output_mode = get_config("output_mode", "both")
            summary_header = get_config("summary_header", "🤖 *Resumo do áudio:*")
            transcription_header = get_config("transcription_header", "🔊 *Transcrição do áudio:*")
            character_limit = int(get_config("character_limit", "500"))

            # Verificar se timestamps estão habilitados
            use_timestamps = get_config("use_timestamps", "false") == "true"
            
            storage.add_log("DEBUG", "Informações da mensagem", {
                "from_me": from_me,
                "remote_jid": remote_jid,
                "is_group": is_group
            })

            # Transcrever áudio
            storage.add_log("INFO", "Iniciando transcrição")
            transcription_text, has_timestamps = await transcribe_audio(
                audio_source,
                apikey=apikey,
                remote_jid=remote_jid,
                from_me=from_me,
                use_timestamps=use_timestamps
            )
            # Log do resultado
            storage.add_log("INFO", "Transcrição concluída", {
                "has_timestamps": has_timestamps,
                "text_length": len(transcription_text),
                "remote_jid": remote_jid
            })
            # Determinar se precisa de resumo baseado no modo de saída
            summary_text = None
            if output_mode in ["both", "summary_only"] or (
                output_mode == "smart" and len(transcription_text) > character_limit
            ):
                summary_text = await summarize_text_if_needed(transcription_text)

            # Construir mensagem baseada no modo de saída
            message_parts = []
            
            if output_mode == "smart":
                if len(transcription_text) > character_limit:
                    message_parts.append(f"{summary_header}\n\n{summary_text}")
                else:
                    message_parts.append(f"{transcription_header}\n\n{transcription_text}")
            else:
                if output_mode in ["both", "summary_only"] and summary_text:
                    message_parts.append(f"{summary_header}\n\n{summary_text}")
                if output_mode in ["both", "transcription_only"]:
                    message_parts.append(f"{transcription_header}\n\n{transcription_text}")
            
            # Adicionar mensagem de negócio
            message_parts.append(dynamic_settings['BUSINESS_MESSAGE'])
            
            # Juntar todas as partes da mensagem
            summary_message = "\n\n".join(message_parts)            

            # Enviar resposta
            await send_message_to_whatsapp(
                server_url,
                instance,
                apikey,
                summary_message,
                remote_jid,
                audio_key,
            )

            # Registrar sucesso
            storage.record_processing(remote_jid)
            storage.add_log("INFO", "Áudio processado com sucesso", {
                "remote_jid": remote_jid,
                "transcription_length": len(transcription_text) if transcription_text else 0,
                "summary_length": len(summary_text) if summary_text else 0  # Adiciona verificação
            })

            return {"message": "Áudio transcrito e resposta enviada com sucesso"}

        except Exception as e:
            storage.add_log("ERROR", f"Erro ao processar áudio: {str(e)}", {
                "error_type": type(e).__name__,
                "remote_jid": remote_jid,
                "traceback": traceback.format_exc()
            })
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao processar áudio: {str(e)}"
            )

    except Exception as e:
        storage.add_log("ERROR", f"Erro na requisição: {str(e)}", {
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        })
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar a requisição: {str(e)}"
        )
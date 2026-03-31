import aiohttp
import json
from typing import Optional, Tuple, Any
from datetime import datetime
import logging
from storage import StorageHandler
import asyncio

logger = logging.getLogger("GROQHandler")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

async def test_groq_key(key: str) -> bool:
    """Teste se uma chave GROQ é válida e está funcionando."""
    url = "https://api.groq.com/openai/v1/models"
    headers = {"Authorization": f"Bearer {key}"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return bool(data.get("data"))
                return False
    except Exception as e:
        logger.error(f"Erro ao testar chave GROQ: {e}")
        return False

async def validate_transcription_response(response_text: str) -> bool:
    """Valide se a resposta da transcrição é significativa."""
    try:
        cleaned_text = response_text.strip()
        return len(cleaned_text) >= 10
    except Exception as e:
        logger.error(f"Erro ao validar resposta da transcrição: {e}")
        return False

async def get_working_groq_key(storage: StorageHandler) -> Optional[str]:
    """Obtenha uma chave GROQ funcional do pool disponível."""
    keys = storage.get_groq_keys()

    for _ in range(len(keys)):
        key = storage.get_next_groq_key()
        if not key:
            continue

        penalized_until = storage.get_penalized_until(key)
        if penalized_until and penalized_until > datetime.utcnow():
            continue

        if await test_groq_key(key):
            return key
        else:
            storage.penalize_key(key, penalty_duration=300)

    storage.add_log("ERROR", "Nenhuma chave GROQ funcional disponível.")
    return None

async def handle_groq_request(
    url: str, 
    headers: dict, 
    data: Any, 
    storage: StorageHandler,
    is_form_data: bool = False
) -> Tuple[bool, dict, str]:
    """Lida com requisições para a API GROQ com suporte a retries e rotação de chaves."""
    max_retries = len(storage.get_groq_keys())
    
    for attempt in range(max_retries):
        try:
            storage.add_log("DEBUG", "Iniciando tentativa de requisição para GROQ", {
                "url": url,
                "is_form_data": is_form_data,
                "attempt": attempt + 1
            })

            async with aiohttp.ClientSession() as session:
                if is_form_data:
                    async with session.post(url, headers=headers, data=data) as response:
                        response_data = await response.json()
                        if response.status == 200 and response_data.get("text"):
                            return True, response_data, ""
                else:
                    async with session.post(url, headers=headers, json=data) as response:
                        response_data = await response.json()
                        if response.status == 200 and response_data.get("choices"):
                            return True, response_data, ""
                
                error_msg = response_data.get("error", {}).get("message", "")
                
                if "organization_restricted" in error_msg or "invalid_api_key" in error_msg:
                    new_key = await get_working_groq_key(storage)
                    if new_key:
                        headers["Authorization"] = f"Bearer {new_key}"
                        await asyncio.sleep(1)
                        continue

                return False, response_data, error_msg

        except Exception as e:
            storage.add_log("ERROR", "Erro na requisição", {"error": str(e)})
            if attempt < max_retries - 1:
                await asyncio.sleep(1)
                continue
            return False, {}, f"Request failed: {str(e)}"

    storage.add_log("ERROR", "Todas as chaves GROQ falharam.")
    return False, {}, "All GROQ keys exhausted."
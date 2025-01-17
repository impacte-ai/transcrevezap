import json
import os
from typing import List, Dict
from datetime import datetime, timedelta
import traceback
import logging
import redis

class StorageHandler:
    def __init__(self):
        # Configuração de logger
        self.logger = logging.getLogger("StorageHandler")
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.DEBUG)
        self.logger.info("StorageHandler inicializado.")

        # Conexão com o Redis usando username e password
        self.redis = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            username=os.getenv('REDIS_USERNAME', 'default'),  # Nome de usuário padrão
            password=os.getenv('REDIS_PASSWORD', ''),         # Senha padrão
            db=int(os.getenv('REDIS_DB', 0)),                 # Banco de dados padrão
            decode_responses=True
        )

        # Retenção de logs e backups
        self.log_retention_hours = int(os.getenv('LOG_RETENTION_HOURS', 48))
        self.backup_retention_days = int(os.getenv('BACKUP_RETENTION_DAYS', 7))

        # Garantir valores padrão para configurações de idioma
        if not self.redis.exists(self._get_redis_key("auto_translation")):
            self.redis.set(self._get_redis_key("auto_translation"), "false")
        
        if not self.redis.exists(self._get_redis_key("auto_language_detection")):
            self.redis.set(self._get_redis_key("auto_language_detection"), "false")
        
    def _get_redis_key(self, key):
        return f"transcrevezap:{key}"

    def add_log(self, level: str, message: str, metadata: dict = None):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "metadata": json.dumps(metadata) if metadata else None
        }
        self.redis.lpush(self._get_redis_key("logs"), json.dumps(log_entry))
        self.redis.ltrim(self._get_redis_key("logs"), 0, 999)  # Manter apenas os últimos 1000 logs
        self.logger.log(getattr(logging, level.upper(), logging.INFO), f"{message} | Metadata: {metadata}")

    def get_allowed_groups(self) -> List[str]:
        return self.redis.smembers(self._get_redis_key("allowed_groups"))

    def add_allowed_group(self, group: str):
        self.redis.sadd(self._get_redis_key("allowed_groups"), group)

    def remove_allowed_group(self, group: str):
        self.redis.srem(self._get_redis_key("allowed_groups"), group)

    def get_blocked_users(self) -> List[str]:
        return self.redis.smembers(self._get_redis_key("blocked_users"))

    def add_blocked_user(self, user: str):
        self.redis.sadd(self._get_redis_key("blocked_users"), user)

    def remove_blocked_user(self, user: str):
        self.redis.srem(self._get_redis_key("blocked_users"), user)

    def get_statistics(self) -> Dict:
        total_processed = int(self.redis.get(self._get_redis_key("total_processed")) or 0)
        last_processed = self.redis.get(self._get_redis_key("last_processed"))
        daily_count = json.loads(self.redis.get(self._get_redis_key("daily_count")) or "{}")
        group_count = json.loads(self.redis.get(self._get_redis_key("group_count")) or "{}")
        user_count = json.loads(self.redis.get(self._get_redis_key("user_count")) or "{}")
        error_count = int(self.redis.get(self._get_redis_key("error_count")) or 0)
        success_rate = float(self.redis.get(self._get_redis_key("success_rate")) or 100.0)

        return {
            "total_processed": total_processed,
            "last_processed": last_processed,
            "stats": {
                "daily_count": daily_count,
                "group_count": group_count,
                "user_count": user_count,
                "error_count": error_count,
                "success_rate": success_rate,
            }
        }

    def can_process_message(self, remote_jid):
        try:
            allowed_groups = self.get_allowed_groups()
            blocked_users = self.get_blocked_users()

            if remote_jid in blocked_users:
                return False
            if "@g.us" in remote_jid and remote_jid not in allowed_groups:
                return False

            return True
        except Exception as e:
            self.logger.error(f"Erro ao verificar se pode processar mensagem: {e}")
            return False

    def record_processing(self, remote_jid):
        try:
            # Incrementar total processado
            self.redis.incr(self._get_redis_key("total_processed"))

            # Atualizar último processamento
            self.redis.set(self._get_redis_key("last_processed"), datetime.now().isoformat())

            # Atualizar contagem diária
            today = datetime.now().strftime("%Y-%m-%d")
            daily_count = json.loads(self.redis.get(self._get_redis_key("daily_count")) or "{}")
            daily_count[today] = daily_count.get(today, 0) + 1
            self.redis.set(self._get_redis_key("daily_count"), json.dumps(daily_count))

            # Atualizar contagem de grupo ou usuário
            if "@g.us" in remote_jid:
                group_count = json.loads(self.redis.get(self._get_redis_key("group_count")) or "{}")
                group_count[remote_jid] = group_count.get(remote_jid, 0) + 1
                self.redis.set(self._get_redis_key("group_count"), json.dumps(group_count))
            else:
                user_count = json.loads(self.redis.get(self._get_redis_key("user_count")) or "{}")
                user_count[remote_jid] = user_count.get(remote_jid, 0) + 1
                self.redis.set(self._get_redis_key("user_count"), json.dumps(user_count))

            # Atualizar taxa de sucesso
            total = int(self.redis.get(self._get_redis_key("total_processed")) or 0)
            errors = int(self.redis.get(self._get_redis_key("error_count")) or 0)
            success_rate = ((total - errors) / total) * 100 if total > 0 else 100
            self.redis.set(self._get_redis_key("success_rate"), success_rate)

        except Exception as e:
            self.logger.error(f"Erro ao registrar processamento: {e}")

    def record_error(self):
        self.redis.incr(self._get_redis_key("error_count"))

    def clean_old_logs(self):
        try:
            cutoff_time = datetime.now() - timedelta(hours=self.log_retention_hours)
            logs = self.redis.lrange(self._get_redis_key("logs"), 0, -1)
            for log in logs:
                log_entry = json.loads(log)
                if datetime.fromisoformat(log_entry["timestamp"]) < cutoff_time:
                    self.redis.lrem(self._get_redis_key("logs"), 0, log)
                else:
                    break  # Assumindo que os logs estão ordenados por tempo
        except Exception as e:
            self.logger.error(f"Erro ao limpar logs antigos: {e}")

    def backup_data(self):
        try:
            data = {
                "allowed_groups": list(self.get_allowed_groups()),
                "blocked_users": list(self.get_blocked_users()),
                "statistics": self.get_statistics(),
            }
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_key = f"backup:{timestamp}"
            self.redis.set(backup_key, json.dumps(data))
            self.redis.expire(backup_key, self.backup_retention_days * 24 * 60 * 60)  # Expira após os dias de retenção
        except Exception as e:
            self.logger.error(f"Erro ao criar backup: {e}")

    def clean_old_backups(self):
        try:
            for key in self.redis.scan_iter("backup:*"):
                if self.redis.ttl(key) <= 0:
                    self.redis.delete(key)
        except Exception as e:
            self.logger.error(f"Erro ao limpar backups antigos: {e}")
            
    # Método de rotação de chaves groq
    def get_groq_keys(self) -> List[str]:
        """Obtém todas as chaves GROQ armazenadas."""
        return list(self.redis.smembers(self._get_redis_key("groq_keys")))

    def add_groq_key(self, key: str):
        """Adiciona uma nova chave GROQ ao conjunto."""
        if key and key.startswith("gsk_"):
            self.redis.sadd(self._get_redis_key("groq_keys"), key)
            return True
        return False

    def remove_groq_key(self, key: str):
        """Remove uma chave GROQ do conjunto."""
        self.redis.srem(self._get_redis_key("groq_keys"), key)

    def get_next_groq_key(self) -> str:
        """
        Obtém a próxima chave GROQ no sistema de rodízio.
        Utiliza um contador no Redis para controlar a rotação.
        """
        keys = self.get_groq_keys()
        if not keys:
            return None  
        # Obtém e incrementa o contador de rodízio
        counter = int(self.redis.get(self._get_redis_key("groq_key_counter")) or "0")
        next_counter = (counter + 1) % len(keys)
        self.redis.set(self._get_redis_key("groq_key_counter"), str(next_counter))
        
        return keys[counter % len(keys)]
    
    def get_message_settings(self):
        """Obtém as configurações de mensagens."""
        return {
            "summary_header": self.redis.get(self._get_redis_key("summary_header")) or "🤖 *Resumo do áudio:*",
            "transcription_header": self.redis.get(self._get_redis_key("transcription_header")) or "🔊 *Transcrição do áudio:*",
            "output_mode": self.redis.get(self._get_redis_key("output_mode")) or "both",
            "character_limit": int(self.redis.get(self._get_redis_key("character_limit")) or "500"),
        }

    def save_message_settings(self, settings: dict):
        """Salva as configurações de mensagens."""
        for key, value in settings.items():
            self.redis.set(self._get_redis_key(key), str(value))
            
    def get_process_mode(self):
        """Retorna o modo de processamento configurado"""
        mode = self.redis.get(self._get_redis_key("process_mode")) or "all"
        self.logger.debug(f"Modo de processamento atual: {mode}")
        return mode

    def get_contact_language(self, contact_id: str) -> str:
        """
        Obtém o idioma configurado para um contato específico.
        O contact_id pode vir com ou sem @s.whatsapp.net
        """
        # Remover @s.whatsapp.net se presente
        contact_id = contact_id.split('@')[0]
        return self.redis.hget(self._get_redis_key("contact_languages"), contact_id)

    def set_contact_language(self, contact_id: str, language: str):
        """
        Define o idioma para um contato específico
        """
        # Remover @s.whatsapp.net se presente
        contact_id = contact_id.split('@')[0]
        self.redis.hset(self._get_redis_key("contact_languages"), contact_id, language)
        self.logger.info(f"Idioma {language} definido para o contato {contact_id}")

    def get_all_contact_languages(self) -> dict:
        """
        Retorna um dicionário com todos os contatos e seus idiomas configurados
        """
        return self.redis.hgetall(self._get_redis_key("contact_languages"))

    def remove_contact_language(self, contact_id: str):
        """
        Remove a configuração de idioma de um contato
        """
        contact_id = contact_id.split('@')[0]
        self.redis.hdel(self._get_redis_key("contact_languages"), contact_id)
        self.logger.info(f"Configuração de idioma removida para o contato {contact_id}")

    def get_auto_language_detection(self) -> bool:
        """
        Verifica se a detecção automática de idioma está ativada
        """
        return self.redis.get(self._get_redis_key("auto_language_detection")) == "true"

    def set_auto_language_detection(self, enabled: bool):
        """
        Ativa ou desativa a detecção automática de idioma
        """
        self.redis.set(self._get_redis_key("auto_language_detection"), str(enabled).lower())
        self.logger.info(f"Detecção automática de idioma {'ativada' if enabled else 'desativada'}")

    def get_auto_translation(self) -> bool:
        """
        Verifica se a tradução automática está ativada
        """
        return self.redis.get(self._get_redis_key("auto_translation")) == "true"

    def set_auto_translation(self, enabled: bool):
        """
        Ativa ou desativa a tradução automática
        """
        self.redis.set(self._get_redis_key("auto_translation"), str(enabled).lower())
        self.logger.info(f"Tradução automática {'ativada' if enabled else 'desativada'}")
        
    def record_language_usage(self, language: str, from_me: bool, auto_detected: bool = False):
        """
        Registra estatísticas de uso de idiomas
        Args:
            language: Código do idioma (ex: 'pt', 'en')
            from_me: Se o áudio foi enviado por nós
            auto_detected: Se o idioma foi detectado automaticamente
        """
        try:
            # Validar idioma
            if not language:
                self.add_log("WARNING", "Tentativa de registrar uso sem idioma definido")
                return

            # Incrementar contagem total do idioma
            self.redis.hincrby(
                self._get_redis_key("language_stats"),
                f"{language}_total",
                1
            )
            
            # Incrementar contagem por direção (enviado/recebido)
            direction = 'sent' if from_me else 'received'
            self.redis.hincrby(
                self._get_redis_key("language_stats"),
                f"{language}_{direction}",
                1
            )
            
            # Se foi detecção automática, registrar
            if auto_detected:
                self.redis.hincrby(
                    self._get_redis_key("language_stats"),
                    f"{language}_auto_detected",
                    1
                )
            
            # Registrar última utilização
            self.redis.hset(
                self._get_redis_key("language_stats"),
                f"{language}_last_used",
                datetime.now().isoformat()
            )

            # Log detalhado
            self.add_log("DEBUG", "Uso de idioma registrado", {
                "language": language,
                "direction": direction,
                "auto_detected": auto_detected
            })

        except Exception as e:
            self.add_log("ERROR", "Erro ao registrar uso de idioma", {
                "error": str(e),
                "type": type(e).__name__
            })
    def get_language_statistics(self) -> Dict:
        """
        Obtém estatísticas de uso de idiomas
        """
        try:
            stats_raw = self.redis.hgetall(self._get_redis_key("language_stats"))
            
            # Organizar estatísticas por idioma
            stats = {}
            for key, value in stats_raw.items():
                lang, metric = key.split('_', 1)
                
                if lang not in stats:
                    stats[lang] = {}
                
                if metric == 'last_used':
                    stats[lang][metric] = value
                else:
                    stats[lang][metric] = int(value)
            
            return stats
        except Exception as e:
            self.logger.error(f"Erro ao obter estatísticas de idioma: {e}")
            return {}

    def cache_language_detection(self, contact_id: str, language: str, confidence: float = 1.0):
        """
        Armazena em cache o idioma detectado para um contato
        """
        contact_id = contact_id.split('@')[0]
        cache_data = {
            'language': language,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat(),
            'auto_detected': True
        }
        self.redis.hset(
            self._get_redis_key("language_detection_cache"),
            contact_id,
            json.dumps(cache_data)
        )

    def get_cached_language(self, contact_id: str) -> Dict:
        """
        Obtém o idioma em cache para um contato
        Retorna None se não houver cache ou se estiver expirado
        """
        contact_id = contact_id.split('@')[0]
        cached = self.redis.hget(
            self._get_redis_key("language_detection_cache"),
            contact_id
        )
        
        if not cached:
            return None
            
        try:
            data = json.loads(cached)
            # Verificar se o cache expirou (24 horas)
            cache_time = datetime.fromisoformat(data['timestamp'])
            if datetime.now() - cache_time > timedelta(hours=24):
                return None
            return data
        except:
            return None
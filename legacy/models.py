from pydantic import BaseModel
from typing import Dict, Any


class WebhookRequest(BaseModel):
    body: Dict[str, Any]

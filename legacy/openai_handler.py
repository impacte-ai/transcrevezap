import aiohttp
import json
from datetime import datetime
import logging
from storage import StorageHandler

logger = logging.getLogger("OpenAIHandler")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

async def test_openai_key(key: str) -> bool:
    """Test if an OpenAI key is valid and working."""
    url = "https://api.openai.com/v1/models"
    headers = {"Authorization": f"Bearer {key}"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return len(data.get("data", [])) > 0
                return False
    except Exception as e:
        logger.error(f"Error testing OpenAI key: {e}")
        return False

async def handle_openai_request(
    url: str, 
    headers: dict, 
    data: any, 
    storage: StorageHandler,
    is_form_data: bool = False
) -> tuple[bool, dict, str]:
    """Handle requests to OpenAI API with retries."""
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            async with aiohttp.ClientSession() as session:
                if is_form_data:
                    async with session.post(url, headers=headers, data=data) as response:
                        response_data = await response.json()
                        if response.status == 200:
                            if is_form_data and response_data.get("text"):
                                return True, response_data, ""
                            elif not is_form_data and response_data.get("choices"):
                                return True, response_data, ""
                else:
                    async with session.post(url, headers=headers, json=data) as response:
                        response_data = await response.json()
                        if response.status == 200 and response_data.get("choices"):
                            return True, response_data, ""
                
                error_msg = response_data.get("error", {}).get("message", "")
                
                if "invalid_api_key" in error_msg or "invalid authorization" in error_msg.lower():
                    logger.error(f"OpenAI API key invalid or expired")
                    return False, response_data, error_msg
                
                if attempt < max_retries - 1:
                    continue

                return False, response_data, error_msg

        except Exception as e:
            logger.error(f"Error in request: {str(e)}")
            if attempt < max_retries - 1:
                continue
            return False, {}, f"Request failed: {str(e)}"

    return False, {}, "All retries failed"
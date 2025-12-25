"""
Groq API Helper
Support for Groq's ultra-fast LPU inference (Llama, Mixtral, Gemma models)
API: https://console.groq.com/
"""
import requests
from typing import Dict, List, Optional
import os


class GroqClient:
    """Client for Groq API (OpenAI-compatible)"""
    
    # Fallback models if API fails
    FALLBACK_MODELS = [
        {
            "id": "llama-3.3-70b-versatile",
            "name": "Llama 3.3 70B Versatile",
            "description": "Best overall performance - Latest",
            "context": 128000,
            "speed": "fast"
        },
        {
            "id": "llama-3.1-70b-versatile",
            "name": "Llama 3.1 70B",
            "description": "High performance",
            "context": 128000,
            "speed": "fast"
        },
        {
            "id": "llama-3.1-8b-instant",
            "name": "Llama 3.1 8B Instant",
            "description": "Fastest inference",
            "context": 128000,
            "speed": "ultra-fast"
        },
        {
            "id": "mixtral-8x7b-32768",
            "name": "Mixtral 8x7B",
            "description": "Long context specialist",
            "context": 32768,
            "speed": "fast"
        },
        {
            "id": "gemma2-9b-it",
            "name": "Gemma 2 9B",
            "description": "Lightweight & efficient",
            "context": 8192,
            "speed": "ultra-fast"
        },
        {
            "id": "qwen/qwen3-32b",
            "name": "Qwen 3 32B",
            "description": "Advanced reasoning",
            "context": 131072,
            "speed": "fast"
        }
    ]
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.groq.com/openai/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def get_models_from_api(self) -> List[Dict]:
        """
        Fetch available models from Groq API
        Endpoint: GET /models
        
        Returns:
            List of model dicts with id, name, description, context, speed
        """
        try:
            url = f"{self.base_url}/models"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            models = data.get('data', [])
            
            # Filter and format models for chat
            chat_models = []
            for model in models:
                model_id = model.get('id', '')
                model_id_lower = model_id.lower()
                
                # Skip non-chat models
                if any(skip in model_id_lower for skip in ['whisper', 'audio', 'guard', 'tts', 'vision', 'prompt-guard']):
                    continue
                
                # Relaxed: Include most models except those explicitly skipped above
                # We no longer strictly filter by 'llama', 'mixtral', etc.
                
                # Skip models with very small context (likely not chat models)
                context = model.get('context_window', 8192)
                if context < 4000:
                    continue
                
                # Speed based on model size
                speed = "fast"
                if '8b' in model_id_lower or '7b' in model_id_lower or '9b' in model_id_lower:
                    speed = "ultra-fast"
                elif '17b' in model_id_lower:
                    speed = "ultra-fast"
                elif '32b' in model_id_lower:
                    speed = "fast"
                elif '70b' in model_id_lower:
                    speed = "fast"
                elif '405b' in model_id_lower:
                    speed = "slow"
                
                # Generate display name
                name = model_id
                if '/' in model_id:
                    name = model_id.split('/')[-1]
                name = name.replace('-', ' ').title()
                
                # Description based on model characteristics
                description = "General purpose chat"
                if '70b' in model_id_lower:
                    description = "Best overall performance"
                elif '8b' in model_id_lower or 'instant' in model_id_lower:
                    description = "Fastest inference"
                elif '32b' in model_id_lower:
                    description = "Balanced performance"
                elif 'versatile' in model_id_lower:
                    description = "Best overall performance"
                if 'scout' in model_id_lower:
                    description = "Efficient reasoning"
                if 'maverick' in model_id_lower:
                    description = "Advanced reasoning"
                
                chat_models.append({
                    "id": model_id,
                    "name": name,
                    "description": description,
                    "context": context,
                    "speed": speed,
                    "owned_by": model.get('owned_by', 'unknown'),
                    "created": model.get('created', 0)
                })
            
            # Sort by context size (larger first) and then by name
            chat_models.sort(key=lambda x: (-x['context'], x['id']))
            
            return chat_models if chat_models else self.FALLBACK_MODELS
            
        except Exception as e:
            print(f"⚠️ Error fetching Groq models from API: {e}")
            return self.FALLBACK_MODELS
    
    @classmethod
    def get_available_models(cls) -> List[Dict]:
        """Get list of fallback Groq models (static)"""
        return cls.FALLBACK_MODELS
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-3.1-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
        timeout: int = 60  # ← ADDED timeout parameter
    ) -> Dict:
        """
        Create chat completion with Groq
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Groq model name
                - llama-3.1-70b-versatile (Best overall)
                - llama-3.1-8b-instant (Fastest)
                - mixtral-8x7b-32768 (Long context)
                - gemma2-9b-it (Lightweight)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream response
            timeout: Request timeout in seconds
            
        Returns:
            Response dict with 'choices' containing generated text
        """
        url = f"{self.base_url}/chat/completions"
        
        payload = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        response = requests.post(url, json=payload, headers=self.headers, timeout=timeout)
        response.raise_for_status()
        
        return response.json()
    
    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: str = "llama-3.1-70b-versatile",
        timeout: int = 60,  # ← INCREASED from 30
        max_retries: int = 3  # ← ADDED retry
    ) -> str:
        """
        Simple text generation with retry mechanism
        
        Args:
            prompt: User prompt
            system_prompt: Optional system instruction
            model: Groq model name
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries
            
        Returns:
            Generated text string
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        # Retry logic with exponential backoff
        import time
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = self.chat_completion(
                    messages, 
                    model=model,
                    timeout=timeout
                )
                return response['choices'][0]['message']['content']
                
            except requests.exceptions.Timeout as e:
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    print(f"⚠️ Groq timeout, retry {attempt + 1}/{max_retries} after {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                    
            except requests.exceptions.ConnectionError as e:
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"⚠️ Groq connection error, retry {attempt + 1}/{max_retries} after {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                    
            except Exception as e:
                # Other errors - don't retry
                raise
        
        # All retries failed
        raise last_error if last_error else Exception("Groq API failed after retries")
    
    def generate_with_vision(
        self,
        prompt: str,
        image_base64: str,
        image_mime_type: str = "image/jpeg",
        system_prompt: Optional[str] = None,
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    ) -> str:
        """
        Generate text with image analysis using Groq Vision model
        
        Args:
            prompt: User prompt/question about the image
            image_base64: Base64 encoded image data
            image_mime_type: MIME type of image (image/jpeg, image/png, etc.)
            system_prompt: Optional system instruction
            model: Vision-capable model (default: llama-4-scout)
            
        Returns:
            Generated text string with image analysis
        """
        url = f"{self.base_url}/chat/completions"
        
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        # Build content with text and image
        user_content = [
            {
                "type": "text",
                "text": prompt
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image_mime_type};base64,{image_base64}"
                }
            }
        ]
        
        messages.append({
            "role": "user",
            "content": user_content
        })
        
        payload = {
            "messages": messages,
            "model": model,
            "temperature": 0.7,
            "max_tokens": 4096
        }
        
        print(f"🖼️ Groq Vision request - model: {model}")
        
        response = requests.post(url, json=payload, headers=self.headers, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']


# Example usage
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env")
        exit(1)
    
    client = GroqClient(api_key)
    
    # Test simple generation
    print("Testing Groq API...")
    response = client.generate_text(
        prompt="Explain quantum computing in simple terms",
        system_prompt="You are a helpful AI assistant.",
        model="llama-3.1-70b-versatile"
    )
    
    print("\n✅ Groq Response:")
    print(response)

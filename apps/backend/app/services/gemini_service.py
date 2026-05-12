import json
from google.genai import Client, types  # 👈 Use this direct import instead
from app.core.config import settings

# Initialize the new Google GenAI client directly
client = Client(api_key=settings.GEMINI_API_KEY)

def validate_and_optimize_prompt(user_prompt: str, inventory_list: list[str]) -> dict:
    """
    Asks Gemini if the request is possible based on inventory and generates a high-quality AI prompt.
    """
    inventory_str = ", ".join(inventory_list)
    
    prompt = f"""
    System: You are an expert Bloomora Florist. 
    Inventory: {inventory_str}
    
    Task:
    1. Check if the user's request is possible using ONLY the inventory above.
    2. If impossible, set is_possible to false and explain why.
    3. If possible, set is_possible to true, create the 'optimized_prompt', AND list the exact names of the inventory items you included in the arrangement.
    
    Response must be JSON:
    {{
        "is_possible": boolean,
        "feedback": string | null,
        "optimized_prompt": string | null,
        "used_items": ["string", "string"]  // 👈 NEW: List the exact inventory names used
    }}
    
    User Request: {user_prompt}
    """

    try:
        # Use the direct 'client' object
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {
            "is_possible": False,
            "feedback": "I'm having trouble checking our inventory right now. Please try again or rephrase your request.",
            "optimized_prompt": None
        }
    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"is_possible": True, "feedback": None, "optimized_prompt": user_prompt}
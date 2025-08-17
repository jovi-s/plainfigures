import json
import re

def extract_json_from_response(text):
    """Extract JSON from OpenAI response with multiple fallback strategies"""
    if not text or text.strip() == "":
        print("Empty response from OpenAI")
        return None
        
    # Strategy 1: Direct JSON parsing
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"Direct JSON parsing failed: {e}")
    
    # Strategy 2: Extract JSON from markdown code blocks
    json_pattern = r'```(?:json)?\s*(\{.*?\})\s*```'
    match = re.search(json_pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        try:
            extracted_json = match.group(1)
            print(f"Extracted JSON from code block: {extracted_json[:200]}...")
            return json.loads(extracted_json)
        except json.JSONDecodeError as e:
            print(f"Failed to parse extracted JSON from code block: {e}")
    
    # Strategy 3: Find JSON-like structure in the text
    json_pattern = r'\{.*?"recommendations".*?\}'
    match = re.search(json_pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        try:
            extracted_json = match.group(0)
            print(f"Extracted JSON pattern: {extracted_json[:200]}...")
            return json.loads(extracted_json)
        except json.JSONDecodeError as e:
            print(f"Failed to parse extracted JSON pattern: {e}")
    
    # Strategy 4: Clean the text and try again
    try:
        # Remove common prefixes/suffixes that might break JSON
        cleaned_text = text.strip()
        if cleaned_text.startswith('```json'):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.startswith('```'):
            cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith('```'):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()
        
        print(f"Trying cleaned text: {cleaned_text[:200]}...")
        return json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        print(f"Failed to parse cleaned text: {e}")
    
    print("All JSON extraction strategies failed")
    return None
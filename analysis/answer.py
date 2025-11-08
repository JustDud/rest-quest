import os
import json
from google import genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Paths to files
base_path = os.path.dirname(__file__)
system_prompt_path = os.path.join(base_path, "gemini_system_prompt.md")
mock_request_path = os.path.join(base_path, "mock_gemini_request.json")
mock_travel_data_path = os.path.join(base_path, "mock_travel_data.json")

# Read the system prompt
with open(system_prompt_path, "r", encoding="utf-8") as f:
    system_prompt = f.read()

# Read the mock Gemini request JSON
with open(mock_request_path, "r", encoding="utf-8") as f:
    mock_request = json.load(f)

# Read the mock travel data JSON
with open(mock_travel_data_path, "r", encoding="utf-8") as f:
    travel_data = json.load(f)

# Combine the prompt as described in the system prompt file
combined_prompt = f"{system_prompt}\n\nMock Request:\n{json.dumps(mock_request, indent=2)}\n\nTravel Data:\n{json.dumps(travel_data, indent=2)}"

# Get the API key from environment variables
api_key = os.getenv("GEMINI_API_KEY")

# Initialize the Gemini client
client = genai.Client(api_key=api_key)

# Generate content using the Gemini model
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=combined_prompt,
    config={"temperature": 0.7, "max_output_tokens": 1024},
)

# Print the result cleanly
print(response.text)
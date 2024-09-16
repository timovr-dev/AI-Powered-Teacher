import requests
import json

# API endpoint URL
url = "http://localhost:8000/generate/"

# Sample data
data = {
    "chat_history": [
        {"role": "assistant", "content": "Hello! How can I assist you today?"},
        {"role": "user", "content": "I'd like to learn about quantum computing."}
    ],
    "user_info": {
        "explanation_complexity": 0.7,
        "teaching_style": "interactive",
        "occupation": "student",
        "learning_goal": "understand basic principles of quantum computing",
        "learning_style": "visual",
        "interests": "physics, computer science"
    }
}

def test_api():
    try:
        # Send POST request to the API
        response = requests.post(url, json=data)
        
        # Check if the request was successful
        if response.status_code == 200:
            print("Request successful!")
            print("Response:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Request failed with status code: {response.status_code}")
            print("Response:")
            print(response.text)
    
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_api()
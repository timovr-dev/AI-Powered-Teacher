import os
import sys
import time
import requests
import json
from requests.exceptions import RequestException

class IBMWatsonXAIWrapper:
    def __init__(self, api_key, project_id, url, model_id="sdaia/allam-1-13b-instruct", max_new_tokens=400, decoding_method="greedy", temperature=0.7, top_p=1, repetition_penalty=1.0, timeout=60):
        self.api_key = api_key
        self.project_id = project_id
        self.base_url = url
        self.url = f"{url}/ml/v1/text/generation?version=2023-05-29"
        self.model_id = model_id
        self.timeout = timeout
        
        self.parameters = {
            "decoding_method": decoding_method,
            "max_new_tokens": max_new_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "repetition_penalty": repetition_penalty
        }
        
        self.access_token = self.get_access_token()
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
        
        print(f"Debug: Initialized with model_id: {self.model_id}")

    def get_access_token(self):
        token_url = "https://iam.cloud.ibm.com/identity/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": self.api_key
        }
        
        try:
            response = requests.post(token_url, headers=headers, data=data, timeout=self.timeout)
            response.raise_for_status()
            return response.json()["access_token"]
        except RequestException as e:
            print(f"Error obtaining access token: {str(e)}")
            sys.exit(1)

    def generate_text(self, prompt):
        body = {
            "input": f"<s> [INST] {prompt} [/INST]",
            "parameters": self.parameters,
            "model_id": self.model_id,
            "project_id": self.project_id
        }
        
        try:
            print("Generating response...", end="", flush=True)
            response = requests.post(
                self.url,
                headers=self.headers,
                json=body,
                timeout=self.timeout
            )
            print("\rGeneration complete.   ")
            
            if response.status_code != 200:
                raise Exception(f"Non-200 response: {response.text}")
            
            data = response.json()
            return data.get('results', [{}])[0].get('generated_text', "No text generated")
        except RequestException as e:
            print(f"\nError: API request failed - {str(e)}")
            return f"Error: API request failed - {str(e)}"
        except Exception as e:
            print(f"\nError: {str(e)}")
            return f"Error: {str(e)}"

def main():
    # project configurations
    api_key = "5tqyQiy2-ZACV9qzY6xTozxSBnI_3uUms_MUPufDQFbW"
    project_id = "de13a787-3de2-49a5-a5ae-845d49453a95"
    url = "https://eu-de.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"

    # model arguments
    max_new_tokens = 120
    decoding_method = 'greedy'
    temperature = 0.05
    top_p = 1.0
    repetition_penalty = 0.0
    timeout = 60

    
    try:
        wrapper = IBMWatsonXAIWrapper(
            api_key=api_key,
            project_id=project_id,
            url=url,
            max_new_tokens=max_new_tokens,
            decoding_method=decoding_method,
            temperature=temperature,
            top_p=top_p,
            repetition_penalty=repetition_penalty,
            timeout=timeout
        )
        
        print("Welcome to the IBM watsonX.ai CLI. Wrapper was written by Sultan Wehaibi. Type '/q' to quit.")
        
        while True:
            user_input = input("You: ")
            if user_input.lower() == '/q':
                print("Goodbye!")
                break
            
            response = wrapper.generate_text(user_input)
            print(f"ALLaM: {response}")
    except Exception as e:
        print(f"Error: {str(e)}")
        print("Please check your API key, project ID, and URL, and make sure you have the correct permissions.")

if __name__ == "__main__":
    main()
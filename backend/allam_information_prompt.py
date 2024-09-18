import requests

url = "https://eu-de.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"

body = {
	"input": "<s> [INST] who are you? (answer in English only) [/INST]  I am your AI assistant here to help. As a helpful AI developed by the National Center for AI, I'\''m here to provide information, answer questions, and assist you in various topics. Feel free to ask me anything, and I'\''ll do my best to help you in English.  </s><s> [INST] how many r does strawberry have? [/INST]  The word \"strawberry\" has two \"r\" sounds. It is pronounced as \"straw-ber-ry\". In the English language, sometimes words have silent letters or sounds, but in this case, both \"r\" sounds are pronounced when saying \"strawberry.\"  </s><s> [INST]",
	"parameters": {
		"decoding_method": "greedy",
		"max_new_tokens": 900,
		"repetition_penalty": 1
	},
	"model_id": "sdaia/allam-1-13b-instruct",
	"project_id": "de13a787-3de2-49a5-a5ae-845d49453a95"
}

headers = {
	"Accept": "application/json",
	"Content-Type": "application/json",
	"Authorization": "Bearer YOUR_ACCESS_TOKEN"
}

response = requests.post(
	url,
	headers=headers,
	json=body
)

if response.status_code != 200:
	raise Exception("Non-200 response: " + str(response.text))

data = response.json()
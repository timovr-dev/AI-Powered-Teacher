from ibm_watsonx_ai.foundation_models import Model
from pprint import pprint


def get_credentials():
    api_key = ""

    return {
        'url': 'https://eu-de.ml.cloud.ibm.com',
        'apikey': api_key
    }

project_id = "de13a787-3de2-49a5-a5ae-845d49453a95"

model_id = 'sdaia/allam-1-13b-instruct'

parameters = {
    'decoding_method':'greedy',
    'max_new_tokens':120,
    'repetition_penalty':1.05
}


model = Model(
    model_id = model_id,
    params = parameters,
    credentials = get_credentials(),
    project_id = project_id
)


input_query  = input('>>>')
generated_response = model.generate_text(prompt=input_query)
pprint(generated_response)
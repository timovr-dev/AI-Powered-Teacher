# FastAPI imports
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import List
import uvicorn

# ALLaM imports
from ibm_watsonx_ai.foundation_models import Model

# Globally loaded models and components
models = {}

class ChatMessage(BaseModel):
    role: str
    content: str

class UserInfo(BaseModel):
    explanation_complexity: float
    teaching_style: str
    occupation: str
    learning_goal: str
    learning_style: str
    interests: str

class GenerationRequest(BaseModel):
    chat_history: List[ChatMessage]
    user_info: UserInfo

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load your LLM model here if needed

    model_id = 'sdaia/allam-1-13b-instruct'
    parameters = {
        'decoding_method':'greedy',
        'max_new_tokens':120,
        'repetition_penalty':1.05
    }

    api_key = "5tqyQiy2-ZACV9qzY6xTozxSBnI_3uUms_MUPufDQFbW"
    project_id = "de13a787-3de2-49a5-a5ae-845d49453a95"

    models['llm'] = Model(
        model_id = model_id,
        params = parameters,
        credentials =  {
            'url': 'https://eu-de.ml.cloud.ibm.com',
            'apikey': api_key
        },
        project_id = project_id
    )

    print("Server started")
    yield
    # Clean up the ML models and release the resources
    models.clear()
    print("Server shutting down")

app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

temp_num = 1

@app.post("/generate/")
async def generate_text(request: GenerationRequest):
    global temp_num
    try:
        # Print chat history
        print("Chat History:")
        print(request.chat_history)
        chat_history = []

        for message in request.chat_history:
            #print(f"Role: {message.role}, Content: {message.content}")

            temp_message = {'role': message.role, 'content':message.content}
            chat_history.append(temp_message)
        
        # Print user information
        print("\nUser Information:")
        print(f"Explanation Complexity: {request.user_info.explanation_complexity}")
        print(f"Teaching Style: {request.user_info.teaching_style}")
        print(f"Occupation: {request.user_info.occupation}")
        print(f"Learning Goal: {request.user_info.learning_goal}")
        print(f"Learning Style: {request.user_info.learning_style}")
        print(f"Interests: {request.user_info.interests}")

        last_user_instruction = chat_history[-1]['content']
        print(f'last user instruction {last_user_instruction}')
        prompt = f"<s> [INST] {last_user_instruction} [/INST]"
        generated_text = models['llm'].generate_text(prompt=prompt)

        # for testing
        #generated_text = f"okay will do it {temp_num}"
        #temp_num += 1

        print(f'erm after generation')
        
        # For now, just return a placeholder response
        return {"generated_text": generated_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# STREAMING TEST
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from ibm_watsonx_ai.foundation_models import Model
#from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

@app.post("/streamer/")
async def stream_response(request: GenerationRequest):
    try:
        chat_history = []
        for message in request.chat_history:
            temp_message = {'role': message.role, 'content': message.content}
            chat_history.append(temp_message)
  
        last_user_instruction = chat_history[-1]['content']
        print(f'last user instruction {last_user_instruction}')
        prompt = f"<s> [INST] {last_user_instruction} [/INST]"

        
        # For now, just return a placeholder response
        return StreamingResponse(models['llm'].generate_text_stream(prompt=prompt))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def run_server(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    run_server()
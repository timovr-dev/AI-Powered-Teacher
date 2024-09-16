from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import List
import uvicorn

# Placeholder for globally loaded models and components
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
    # models['llm'] = YourLLMModel()
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

@app.post("/generate/")
async def generate_text(request: GenerationRequest):
    try:
        # Print chat history
        print("Chat History:")
        for message in request.chat_history:
            print(f"Role: {message.role}, Content: {message.content}")
        
        # Print user information
        print("\nUser Information:")
        print(f"Explanation Complexity: {request.user_info.explanation_complexity}")
        print(f"Teaching Style: {request.user_info.teaching_style}")
        print(f"Occupation: {request.user_info.occupation}")
        print(f"Learning Goal: {request.user_info.learning_goal}")
        print(f"Learning Style: {request.user_info.learning_style}")
        print(f"Interests: {request.user_info.interests}")
        
        # For now, just return a placeholder response
        return {"generated_text": "This is a placeholder response. The server has received and printed your input."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_server(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    run_server()
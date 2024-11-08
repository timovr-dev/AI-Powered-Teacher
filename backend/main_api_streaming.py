# FastAPI imports
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import List
import asyncio
import uvicorn
import os
from prompts_with_examples import *

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
    # Load your LLM model here
    model_id = 'sdaia/allam-1-13b-instruct'
    parameters = {
        'decoding_method': 'greedy',
        'max_new_tokens': 1536,  # 300,  # 120, # with 120 we got incomplete responses, let's use the max 1536
        'repetition_penalty': 1.05
    }

    api_key = str(os.environ.get('ALLAM_WATSONX_KEY'))  # "Your ALLAM API Key"
    project_id = str(os.environ.get('ALLAM_PROJECT_ID'))  # "Your ALLAM Project ID"


    models['llm'] = Model(
        model_id=model_id,
        params=parameters,
        credentials={
            'url': 'https://eu-de.ml.cloud.ibm.com',
            'apikey': api_key
        },
        project_id=project_id
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


# Updated AsyncIteratorWrapper
class AsyncIteratorWrapper:
    def __init__(self, iterator):
        self.iterator = iterator

    def __aiter__(self):
        return self

    async def __anext__(self):
        def next_wrapper():
            try:
                return next(self.iterator)
            except StopIteration:
                return None

        loop = asyncio.get_event_loop()
        value = await loop.run_in_executor(None, next_wrapper)

        if value is None:
            raise StopAsyncIteration
        else:
            return value


@app.post("/help-chat/")
async def stream_response(request: GenerationRequest):
    try:
        chat_history = []
        for message in request.chat_history:
            temp_message = {'role': message.role, 'content': message.content}
            chat_history.append(temp_message)

        # Print user information (optional for debugging)
        print("\nUser Information:")
        print(f"Explanation Complexity: {request.user_info.explanation_complexity}")
        print(f"Teaching Style: {request.user_info.teaching_style}")
        print(f"Occupation: {request.user_info.occupation}")
        print(f"Learning Goal: {request.user_info.learning_goal}")
        print(f"Learning Style: {request.user_info.learning_style}")
        print(f"Interests: {request.user_info.interests}")

        last_user_instruction = chat_history[-1]['content']
        print(f'Last user instruction: {last_user_instruction}')

        system_prompt = '' # _get_paraphrasing_prompt() for mazen
        prompt = f"<s> [INST] {last_user_instruction} [/INST]"

        gen = models['llm'].generate_text_stream(prompt=prompt)

        async def event_generator():
            async for chunk in AsyncIteratorWrapper(gen):
                yield chunk

        return StreamingResponse(event_generator(), media_type="text/plain")
    except Exception as e:
        print(f'Error in /streamer/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streamer-with-context/")
async def stream_response_mazen(request: GenerationRequest):
    try:
        chat_history = []
        for message in request.chat_history:
            temp_message = {'role': message.role, 'content': message.content}
            chat_history.append(temp_message)

        # Print user information (optional for debugging)
        print("\nUser Information:")
        print(f"Explanation Complexity: {request.user_info.explanation_complexity}")
        print(f"Teaching Style: {request.user_info.teaching_style}")
        print(f"Occupation: {request.user_info.occupation}")
        print(f"Learning Goal: {request.user_info.learning_goal}")
        print(f"Learning Style: {request.user_info.learning_style}")
        print(f"Interests: {request.user_info.interests}")

        last_user_instruction = chat_history[-1]['content']
        print(f'Last user instruction: {last_user_instruction}')

        formatted_question = f"""<s> [INST] {last_user_instruction} [/INST]"""

        # choose one of the system prompts we prepared, i.e. one use-case

        # 1. For science, it worked well with user interests
        # system_prompt = get_science_and_student_interest_prompt()
        # prompt = f"""{system_prompt}{"Now, follow the style of paraphrasing and simplification you learned from the given examples and then answer the following question accordingly!"}{chat_history[:-1]}{formatted_question}{"User interest: " + str(request.user_info.interests)}"""

        # 2. For Arabic grammer, we try it first without user interests
        # it worked well without user interests
        # system_prompt = get_arabic_grammar_prompt()
        # prompt = f"""{system_prompt}{"Now, follow the style of paraphrasing and simplification you learned from the given examples and then answer the following question accordingly!"}{chat_history[:-1]}{formatted_question}"""

        # Now, let's try it with user interests:
        # 2.A. user interests only passed in system prompt, not in examples
        # As expected, user interests were ignored because it did not exit in the examples
        # system_prompt = get_arabic_grammar_prompt()
        # prompt = f"""{system_prompt}{"Now, follow the style of paraphrasing and simplification you learned from the given examples and then answer the following question accordingly!"}{chat_history[:-1]}{formatted_question}{"User interest: " + str(request.user_info.interests)}"""

        # 2.B. user interests passed in system prompt, and existed in examples
        # status: It worked perfectly
        system_prompt = get_arabic_grammar_with_user_interests_prompt()
        prompt = f"""{system_prompt}{"Now, follow the style of paraphrasing and simplification you learned from the given examples and then answer the following question accordingly!"}{chat_history[:-1]}{formatted_question}{"User interest: " + str(request.user_info.interests)}"""

        # 3. For Math, we try it first without user interests
        # Status: It worked, Okay
        # system_prompt = get_math_prompt()
        # prompt = f"""{system_prompt}{"Now, Your tasks are the following: 1. If the user writes a Math problem, follow the examples you learned to explain the given problem in a very simple Arabic language (Saudi dialect). 2. If the user asks a follow-up question, just answer his question concretely."}{chat_history[:-1]}{formatted_question}"""

        gen = models['llm'].generate_text_stream(prompt=prompt)

        # Append the response as assistant msg to the chat history for complete context
        # Capture the response from the stream
        full_response = ""

        async def event_generator():
            nonlocal full_response  # Capture the full response
            async for chunk in AsyncIteratorWrapper(gen):
                full_response += chunk  # Append each chunk to the full response
                yield chunk

        # Once the stream completes, append it to the chat history
        chat_history.append({
            'role': 'assistant',
            'content': full_response
        })

        return StreamingResponse(event_generator(), media_type="text/plain")
    except Exception as e:
        print(f'Error in /streamer/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


def run_server(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    run_server()

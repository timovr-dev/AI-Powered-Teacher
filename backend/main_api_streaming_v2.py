# FastAPI imports
from fastapi import FastAPI, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import List
import asyncio
import uvicorn
import os

# Additional imports for session management
from starlette.middleware.sessions import SessionMiddleware

# Additional imports for PDF processing and OpenAI API
import PyPDF2
from openai import OpenAI
import json
import uuid

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
        'max_new_tokens': 300,  # 120, # with 120 we got incomplete responses
        'repetition_penalty': 1.05
    }

    # Use environment variables or secure methods to handle API keys
    api_key = str(os.environ.get('ALLAM_WATSONX_KEY'))  # "5tqyQiy2-ZACV9qzY6xTozxSBnI_3uUms_MUPufDQFbW"
    project_id = str(os.environ.get('ALLAM_PROJECT_ID'))  #  "de13a787-3de2-49a5-a5ae-845d49453a95"

    models['llm'] = Model(
        model_id=model_id,
        params=parameters,
        credentials={
            'url': 'https://eu-de.ml.cloud.ibm.com',
            'apikey': api_key
        },
        project_id=project_id
    )
    # Ensure OpenAI API key is set
    openai_api_key = os.environ.get('OPENAI_API_KEY')



    models['openai_client']= OpenAI(api_key=openai_api_key)

    print("Server started")
    yield
    # Clean up the ML models and release the resources
    models.clear()
    print("Server shutting down")

app = FastAPI(lifespan=lifespan)

# Add session middleware
secret_key = os.environ.get('SESSION_SECRET_KEY', 'default-secret-key')  # Replace with a secure key
app.add_middleware(SessionMiddleware, secret_key=secret_key)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins; adjust in production
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

        system_prompt = get_science_and_student_interest_prompt()  # for mazen
        # prompt = f"<s> [INST] {last_user_instruction} [/INST]"
        prompt = f"""{system_prompt}{"Now, follow the style of paraphrasing and simplification you learned from the given examples and then answer the following question accordingly!"}{formatted_question}{"User interest: " + str(request.user_info.interests)}"""

        gen = models['llm'].generate_text_stream(prompt=prompt)

        async def event_generator():
            async for chunk in AsyncIteratorWrapper(gen):
                yield chunk

        return StreamingResponse(event_generator(), media_type="text/plain")
    except Exception as e:
        print(f'Error in /streamer/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-pdf/")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    try:
        # Ensure 'pdf_documents' directory exists
        os.makedirs('pdf_documents', exist_ok=True)

        # Generate a unique filename to avoid conflicts
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_location = os.path.join('pdf_documents', unique_filename)

        # Save the uploaded PDF file
        with open(file_location, "wb") as file_object:
            file_content = await file.read()
            file_object.write(file_content)

        # Store the path in the session
        request.session['learn_content'] = file_location

        # Step 1: Extract text from the PDF file
        pdf_content = extract_text_from_pdf(file_location)

        # Step 2: Send the text to the OpenAI API
        learning_plan = await create_learning_plan(pdf_content)

        # Step 3: Save the learning plan JSON file
        os.makedirs('learn_plan', exist_ok=True)
        json_filename = f"{unique_filename}_learnplan.json"
        json_file_location = os.path.join('learn_plan', json_filename)
        save_learning_plan_to_json(learning_plan, json_file_location)

        # Step 4: Return learning plan
        learning_plan_json = json.loads(learning_plan)
        return learning_plan_json

    except Exception as e:
        print(f'Error in /upload-pdf/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))

def extract_text_from_pdf(file_path):
    try:
        reader = PyPDF2.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        raise

async def create_learning_plan(content):
    try:
        system_prompt = """
        You are an expert curriculum designer. Your task is to create a structured learning plan 
        from the given content. The plan should be divided into logical sections, each containing 
        200-300 words. Maintain the original structure and order of the content, ensuring that 
        each chunk makes sense to learn in the given sequence.
        """

        user_prompt = f"""
        Please create a structured learning plan from the following content. Divide the plan into 
        sections of 200-300 words each, maintaining the original content and structure. Generate a JSON structure with the keys 'content_1', 'content_2', ..., 'content_n'. The values should be the sections.

        This is the content:
        {content}
        """

        completion = models['openai_client'].chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )

        learning_plan = completion.choices[0].message.content

        # Remove JSON markdown if present
        if learning_plan.startswith('```json') and learning_plan.endswith('```'):
            learning_plan = learning_plan[7:-3]  # Remove ```json from start and ``` from end

        
        return learning_plan

    except Exception as e:
        print(f"Error creating learning plan: {e}")
        raise

def save_learning_plan_to_json(learning_plan, output_file):
    try:
        # Parse the learning plan as JSON
        parsed_plan = json.loads(learning_plan)

        with open(output_file, 'w') as file:
            json.dump(parsed_plan, file, indent=4)
    except json.JSONDecodeError:
        print("Failed to parse the learning plan as JSON. Saving raw content.")
        with open(output_file, 'w') as file:
            file.write(learning_plan)
    except Exception as e:
        print(f"Error saving learning plan to JSON: {e}")
        raise

def run_server(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    run_server()
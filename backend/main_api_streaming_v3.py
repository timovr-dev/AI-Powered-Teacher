############################
# FastAPI imports
from fastapi import FastAPI, HTTPException, File, UploadFile, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import List
import asyncio
import uvicorn
import os
import re

# Additional imports for session management
from starlette.middleware.sessions import SessionMiddleware

# Additional imports for PDF processing and OpenAI API
import PyPDF2
from openai import OpenAI
import json
import uuid
import requests  # Added for image downloading

# ALLaM imports
from ibm_watsonx_ai.foundation_models import Model
from prompts_with_examples import *

# RAG imports
from RAG.RAGApplication2 import RAGSystem
from langchain.embeddings import SentenceTransformerEmbeddings  # Import the embedding model

# Azure Speech SDK import
import azure.cognitiveservices.speech as speechsdk  # azure-cognitiveservices-speech

# Enums
from enum import Enum

# Globally loaded models and components
models = {}


class SystemPrompt(Enum):
    Unsupported = 1
    Arabic_Grammar = 2
    Science = 3
    Math = 4


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


class ImageRequest(BaseModel):
    prompt: str
    user_info: UserInfo


class SynthesizeRequest(BaseModel):
    text: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load your LLM model here
    model_id = 'sdaia/allam-1-13b-instruct'
    parameters = {
        'decoding_method': 'greedy',
        'max_new_tokens': 1536,
        'repetition_penalty': 1.05
    }

    # Use environment variables or secure methods to handle API keys
    api_key = str(os.environ.get('ALLAM_WATSONX_KEY'))
    project_id = str(os.environ.get('ALLAM_PROJECT_ID'))

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
    models['openai_client'] = OpenAI(api_key=openai_api_key)

    # Initialize Azure Speech SDK

    speech_key = os.environ.get('SPEECH_KEY')
    speech_region = os.environ.get('SPEECH_REGION')
    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)
    speech_config.speech_synthesis_voice_name = 'ar-SA-ZariyahNeural'

    models['speech_config'] = speech_config

    ## Load the embedding model globally
    embedding_model_name = "intfloat/multilingual-e5-large"
    embedding_model = SentenceTransformerEmbeddings(
        model_name=embedding_model_name
    )

    models['rag_system'] = RAGSystem(embedding_model)

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
    allow_origins=["http://localhost:3000"],  # Enter the URL of the Webserver in this case our react webserver
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


def get_user_id(request: Request):
    if 'user_id' not in request.session:
        request.session['user_id'] = str(uuid.uuid4())
    return request.session['user_id']


def get_user_folder(user_id: str):
    user_folder = os.path.join('users', user_id)
    os.makedirs(user_folder, exist_ok=True)
    return user_folder


@app.post("/help-chat/")
async def stream_response(request: Request, generation_request: GenerationRequest):
    try:
        # Get user ID and folder
        user_id = get_user_id(request)
        user_folder = get_user_folder(user_id)
        print(f"user_id: {user_id}")
        print(f"user_id: {user_folder}")

        chat_history = []
        for message in generation_request.chat_history:
            temp_message = {'role': message.role, 'content': message.content}
            chat_history.append(temp_message)

        # Print user information (optional for debugging)
        print("\nUser Information:")
        print(f"Explanation Complexity: {generation_request.user_info.explanation_complexity}")
        print(f"Teaching Style: {generation_request.user_info.teaching_style}")
        print(f"Occupation: {generation_request.user_info.occupation}")
        print(f"Learning Goal: {generation_request.user_info.learning_goal}")
        print(f"Learning Style: {generation_request.user_info.learning_style}")
        print(f"Interests: {generation_request.user_info.interests}")

        system_prompt = """You are an AI assistant answering questions exclusively based only on the information in these three chunks:
Chunk 1:
<<CHUNK1>>
Chunk 2:
<<CHUNK2>>
Chunk 3:
<<CHUNK3>>
User's question: <<QUESTION>>
Answer the question using only information from these chunks. 
If the answer isn't fully contained in the chunks, answer the following: ""  you don't have enough information to respond because you have to answer only based on the underlying information..
Thus, never use external knowledge to answer. Similarly, never use your own knowledge to answer. Also, never make assumptions. 
If you cannot answer from the chunks, simply say I don't have enough information to respond because I have to answer only based on the underlying information.  
Answer always in Arabic, never answer in English."""

        last_user_question = chat_history[-1]['content']

        # user vectorstore path (learning plan)
        user_embedding_path = request.session['user_vector_db_path']
        # ref vectorstore path (External knowledge Ref)
        ref_knowledge_path = request.session['ref_knowledge_path']
        most_similar_chunks = models['rag_system'].retrieve_top_chunks_from_two_vectorstores(user_embedding_path, ref_knowledge_path, last_user_question)

        # create entire prompt
        system_prompt_temp = system_prompt.replace("<<QUESTION>>", last_user_question)
        system_prompt_temp = system_prompt_temp.replace("<<CHUNK1>>", most_similar_chunks[0])
        system_prompt_temp = system_prompt_temp.replace("<<CHUNK2>>", most_similar_chunks[1])
        system_prompt_temp = system_prompt_temp.replace("<<CHUNK3>>", most_similar_chunks[2])

        prompt = f"<s> [INST] {system_prompt_temp} [/INST] Answer: "
        print("-" * 50)
        print(prompt)
        print("-" * 50)

        # generate response
        gen = models['llm'].generate_text_stream(prompt=prompt)

        async def event_generator():
            async for chunk in AsyncIteratorWrapper(gen):
                yield chunk

        return StreamingResponse(event_generator(), media_type="text/plain")
    except Exception as e:
        print(f'Error in /help-chat/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simplify/")
async def stream_simplified_text(request: Request, generation_request: GenerationRequest):
    try:
        chat_history = []
        for message in generation_request.chat_history:
            temp_message = {'role': message.role, 'content': message.content}
            chat_history.append(temp_message)
        # if new topic has just been uploaded, keep only the user question in chat_history and reset clear_chat_history
        if request.session['clear_chat_history']:
            chat_history = [chat_history[-1]]  # chat_history is a list with one element: user question
            request.session['clear_chat_history'] = False

        # Print user information (optional for debugging)
        print("\nUser Information:")
        print(f"Explanation Complexity: {generation_request.user_info.explanation_complexity}")
        print(f"Teaching Style: {generation_request.user_info.teaching_style}")
        print(f"Occupation: {generation_request.user_info.occupation}")
        print(f"Learning Goal: {generation_request.user_info.learning_goal}")
        print(f"Learning Style: {generation_request.user_info.learning_style}")
        print(f"Interests: {generation_request.user_info.interests}")

        last_user_instruction = chat_history[-1]['content']
        print(f'Last user instruction: {last_user_instruction}')

        formatted_question = f"""<s> [INST] {last_user_instruction} [/INST]"""

        # use the classified system prompt which has been set based on the uploaded content
        classified_system_prompt = None
        if request.session['prompt_key'] == SystemPrompt.Science.name:
            classified_system_prompt = get_science_and_student_interest_prompt()
        elif request.session['prompt_key'] == SystemPrompt.Arabic_Grammar.name:
            classified_system_prompt = get_arabic_grammar_with_user_interests_prompt()
        elif request.session['prompt_key'] == SystemPrompt.Math.name:
            classified_system_prompt = get_math_prompt()

        if classified_system_prompt is None:
            raise ValueError("The uploaded topic is not supported yet by our simplifier!!")
        else:
            print("classified_system_prompt will be used!!")
        prompt = f"""{classified_system_prompt}{"Now, follow the style of paraphrasing and simplification you learned from the given examples and then answer the following question accordingly!"}{chat_history[:-1]}{formatted_question}{"User interest: " + str(generation_request.user_info.interests)}[/INST]"""

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
        print(f'Error in /simplify/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-image/")
async def generate_image(request: Request, image_request: ImageRequest):
    try:
        # Get user ID and folder
        user_id = get_user_id(request)
        user_folder = get_user_folder(user_id)
        print(f"user_id {user_id}")
        print(f"user_folder {user_folder}")

        # Print user information (optional for debugging)
        print("\nUser Information:")
        print(f"Explanation Complexity: {image_request.user_info.explanation_complexity}")
        print(f"Teaching Style: {image_request.user_info.teaching_style}")
        print(f"Occupation: {image_request.user_info.occupation}")
        print(f"Learning Goal: {image_request.user_info.learning_goal}")
        print(f"Learning Style: {image_request.user_info.learning_style}")
        print(f"Interests: {image_request.user_info.interests}")

        text_to_image_prompt = image_request.prompt

        # Generate the image using the DALL·E 3 model
        response = models['openai_client'].images.generate(
            model="dall-e-3",
            prompt=text_to_image_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        # Extract the image URL from the response
        image_url = response.data[0].url
        print(f"Image URL: {image_url}")

        # Download the image and save it in the user's folder
        image_response = requests.get(image_url)
        if image_response.status_code == 200:
            # Generate a unique image filename
            image_filename = f"{uuid.uuid4()}.png"
            image_path = os.path.join(user_folder, image_filename)
            with open(image_path, 'wb') as f:
                f.write(image_response.content)
            print(f"Image saved at: {image_path}")
        else:
            print("Failed to download the image")

        # Return the image URL (or the path)
        return {"image_url": image_url}
    except Exception as e:
        print(f'Error in /generate-image/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-pdf/")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    try:
        # Get user ID and folder
        user_id = get_user_id(request)
        user_folder = get_user_folder(user_id)

        # Generate a unique filename to avoid conflicts
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_location = os.path.join(user_folder, unique_filename)

        # Save the uploaded PDF file
        with open(file_location, "wb") as file_object:
            file_content = await file.read()
            file_object.write(file_content)

        # Store the path in the session (optional)
        request.session['learn_content_path'] = file_location

        # Step 1: Extract text from the PDF file
        pdf_content = extract_text_from_pdf(file_location)
        # Step 1.A: Classify system prompt
        prompt_key, ref_knowledge_path = classify_topic(pdf_content=pdf_content)
        request.session['prompt_key'] = prompt_key
        request.session['ref_knowledge_path'] = ref_knowledge_path

        # Step 2: Send the text to the OpenAI API
        learning_plan = await create_learning_plan(pdf_content)

        # Step 3: Save the learning plan JSON file in the user's folder
        json_filename = f"{unique_filename}_learnplan.json"
        json_file_location = os.path.join(user_folder, json_filename)
        save_learning_plan_to_json(learning_plan, json_file_location)

        # Step 4: Create Vector-database from learning plan and save its path in the session
        user_vector_db_path = os.path.join(user_folder, "user_vector_db")
        request.session['user_vector_db_path'] = user_vector_db_path
        models['rag_system'].create_faiss_from_text(learning_plan, user_vector_db_path)

        # Step 5: Return learning plan
        learning_plan_json = json.loads(learning_plan)

        # Step 6: Create a learning plan in a markdown format
        learning_plan_markdown = create_markdown_learning_plan(learning_plan_json)

        # Step 7: At this point, uploading a new topic is succeeded, thus, flag clear_chat_history when simplifying..
        request.session['clear_chat_history'] = True

        # Return the markdown content as a JSON object
        return {"learn-content": learning_plan_markdown}
    except Exception as e:
        print(f'Error in /upload-pdf/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


def classify_topic(pdf_content):
    """
    This functions classifies the given pdf_content into the corresponding system prompt.
    The global classified_system_prompt will be set as a result.
    :return:
    """
    system_prompt = get_system_prompt_classifier()
    prompt = f"""{system_prompt}{"Now, follow the given examples and classify the following content accordingly!"}{pdf_content}[/INST]"""
    topic = models['llm'].generate(prompt=prompt)['results'][0]['generated_text']

    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("Prompt Classifier: {}".format(prompt))
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")

    print("###############################")
    print("Classified Topic: {}".format(topic))
    print("###############################")

    # set the global classified_system_prompt and system_prompt_name
    prompt_key = None
    ref_knowledge_path = None
    if "General Science" in topic:
        prompt_key = SystemPrompt.Science.name
        ref_knowledge_path = "./RAG_DB/General_Science-VS"
    elif "Arabic Grammar" in topic:
        prompt_key = SystemPrompt.Arabic_Grammar.name
        ref_knowledge_path = "./RAG_DB/Arabic_Grammar-VS"
    elif "Math" in topic:
        prompt_key = SystemPrompt.Math.name
        ref_knowledge_path = "./RAG_DB/Math-VS"
    else:
        print("The uploaded topic is not supported yet by our simplifier!!")

    return prompt_key, ref_knowledge_path


def create_markdown_learning_plan(learning_plan_json):
    markdown_content = []
    for key in sorted(learning_plan_json.keys()):
        markdown_content.append(learning_plan_json[key])
    return '\n\n'.join(markdown_content)


def extract_text_from_pdf(file_path):
    try:
        reader = PyPDF2.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
        # Process the text to fix numbers and specific words
        fixed_text = fix_arabic_numbers_and_words(text)
        return fixed_text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        raise


def fix_arabic_numbers_and_words(text):
    # Replace reversed "ريال" with the correct word
    text = text.replace('لاير', 'ريال')

    # Define Arabic digits
    arabic_digits = '٠١٢٣٤٥٦٧٨٩'
    # Regular expression pattern to match sequences of Arabic digits
    digit_pattern = '[' + arabic_digits + ']+'

    # Function to reverse Arabic numbers in a match
    def reverse_arabic_numbers(match):
        return match.group(0)[::-1]

    # Replace each sequence of digits with its reversed version
    fixed_text = re.sub(digit_pattern, reverse_arabic_numbers, text)

    return fixed_text


async def create_learning_plan(content):
    try:
        system_prompt = """
        You are an expert curriculum designer. Your task is to create a structured learning plan 
        from the given content. When you are writing the content use markdown format to highlighted important words. You can use (bold, italic, tables, blockquotes or lists). The plan should be divided into logical sections, each containing 
        200-300 words. Maintain the original structure and order of the content, ensuring that 
        each chunk makes sense to learn in the given sequence.

        Always follow this structure in your output: Title in bold, and few lines under it. 
        If you decide to add any text from your own, show it in a different format, under corresponding titles to let user know its yours, not the original.

        Use in the learning plan the following mark down components:
        - bold text
        - small headings
        - tables
        - quotes (>)
        
        At least, you have to bold the main terms in the text you show.
        Always write in Arabic, never write in English.
        """
        #Always write in Arabic, never write in English.

        user_prompt = f"""
        Please create a structured learning plan from the following content. Divide the plan into 
        sections of 200-300 words each, maintaining the original content and structure. Generate a JSON structure with the keys 'content_1', 'content_2', ..., 'content_n'. The values should be the sections.

        This is the content:
        {content}
        """

        completion = models['openai_client'].chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.1,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )

        learning_plan = completion.choices[0].message.content

        # Remove JSON markdown if present
        if learning_plan.startswith('```json') and learning_plan.endswith('```'):
            learning_plan = learning_plan[7:-3]  # Remove ```json from start and ```

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


# New endpoint for text-to-speech synthesis
@app.post("/synthesize/")
async def synthesize_speech(request: SynthesizeRequest):
    try:
        text = request.text
        if not text:
            return HTTPException(status_code=400, detail="No text provided")

        # Check if the folder "tts_output" exists, if not, create it
        tts_output = "tts_output"
        if not os.path.exists(tts_output):
            os.makedirs(tts_output)

        # Generate a unique filename
        audio_filename = f"{tts_output}/{uuid.uuid4()}.wav"
        audio_output_config = speechsdk.audio.AudioOutputConfig(filename=audio_filename)
        speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=models['speech_config'],
                                                         audio_config=audio_output_config)

        # Synthesize speech
        result = speech_synthesizer.speak_text_async(text).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            # Read the audio file and return it
            def iterfile():
                with open(audio_filename, mode="rb") as file_like:
                    yield from file_like

            # Remove the audio file after sending it
            response = StreamingResponse(iterfile(), media_type="audio/wav")
            response.headers["Content-Disposition"] = f"attachment; filename={audio_filename}"
            return response
        else:
            if result.reason == speechsdk.ResultReason.Canceled:
                cancellation_details = result.cancellation_details
                return HTTPException(status_code=500, detail=cancellation_details.reason)
        return HTTPException(status_code=500, detail="Unknown error occurred")
    except Exception as e:
        print(f'Error in /synthesize/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


def run_server(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    run_server()
############################

############################
# FastAPI imports
from fastapi import FastAPI, HTTPException, File, UploadFile, Request, Response, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import List
import asyncio
import uvicorn
import os
import re
import shutil


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

from prompts_with_examples import get_general_paraphrasing_prompt

# RAG imports
from RAG.RAGApplication2 import RAGSystem
from langchain.embeddings import SentenceTransformerEmbeddings  # Import the embedding model
from RAG_DB.learn_material_to_vectordb import PDFVectorStore

# Azure Speech SDK import
import azure.cognitiveservices.speech as speechsdk  # azure-cognitiveservices-speech


# dynamic prompts
from dynamic_system_prompts.dynamic_classifier_prompt_builder import get_dynamic_classifier_prompt
from dynamic_system_prompts.dynamic_system_prompts_builder import build_all_system_prompts

# Globally loaded models and components
models = {}
# Global user dictionary
user_dict = {}


def initialize_user_dict(user_id):
    """
    Ensures the user_id exists in the user_dict.
    If it doesn't, initializes an empty dictionary for that user.
    """
    if not user_exists_in_dict(user_id=user_id):
        user_dict[user_id] = {}
        user_dict[user_id]['clear_chat_history'] = False


def user_exists_in_dict(user_id):
    """
    Checks if the given user_id exists in the user_dict.
    """
    return user_id in user_dict


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

        # check if user exists in dictionary, i.e. user has uploaded a document
        if not user_exists_in_dict(user_id=user_id):
            raise ValueError("No file has been uploaded yet!!")

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
        # user_embedding_path = request.session['user_vector_db_path']
        user_embedding_path = user_dict[user_id]['user_vector_db_path']
        # ref vectorstore path (External knowledge Ref)
        # ref_knowledge_path = request.session['ref_knowledge_path']
        ref_knowledge_path = user_dict[user_id]['ref_knowledge_path']
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
        user_id = get_user_id(request=request)
        # initialize user dictionary if necessary
        initialize_user_dict(user_id=user_id)

        # check for clearing the history
        if user_dict[user_id]['clear_chat_history']:
            chat_history = [chat_history[-1]]  # chat_history is a list with one element: user question
            user_dict[user_id]['clear_chat_history'] = False
        # if request.session['clear_chat_history']:
        #     chat_history = [chat_history[-1]]  # chat_history is a list with one element: user question
        #     request.session['clear_chat_history'] = False

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

        # here for General Paraphrasing
        prompt_key = request.session.get('prompt_key', 'General_Paraphrasing')

        if prompt_key == "General_Paraphrasing":
            # Use the general paraphrasing prompt
            print("General paraphrasing prompt will be used.")
            general_prompt = get_general_paraphrasing_prompt()
            prompt = f"{general_prompt} Now, follow the style of paraphrasing and simplification you learned from the given examples and then answer the following question accordingly! {formatted_question} User interest: {str(generation_request.user_info.interests)} [/INST]"
        else:
            # build all system prompts dynamically
            topic_dict = build_all_system_prompts(base_folder='./dynamic_system_prompts')

            # this is just debugging check, this condition must not apply because the support is dynamic
            if request.session['prompt_key'] not in topic_dict.keys():
                raise ValueError("The uploaded topic is not supported yet by our simplifier!!")

            # set the corresponding system prompt
            definition_instructions_examples_prompt = topic_dict[request.session['prompt_key']]
            classified_system_prompt = definition_instructions_examples_prompt[3]
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

        # Important: here we initialize the user dictionary for first upload
        initialize_user_dict(user_id)

        # Generate a unique filename to avoid conflicts
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_location = os.path.join(user_folder, unique_filename)

        # Save the uploaded PDF file
        with open(file_location, "wb") as file_object:
            file_content = await file.read()
            file_object.write(file_content)

        # Store the path in the session (optional)
        # request.session['learn_content_path'] = file_location
        user_dict[user_id]['learn_content_path'] = file_location

        # Step 1: Extract text from the PDF file
        pdf_content = extract_text_from_pdf(file_location)
        # Step 1.A: Classify system prompt
        topic, ref_knowledge_path = classify_topic(pdf_content=pdf_content)
        request.session['prompt_key'] = topic.strip()
        # request.session['ref_knowledge_path'] = ref_knowledge_path
        user_dict[user_id]['ref_knowledge_path'] = ref_knowledge_path

        # Step 2: Prepare the learning plan as an iterator response
        openai_response = create_learning_plan(pdf_content)

        # Collect the learning plan as it's streamed
        learning_plan_buffer = []

        async def stream_learning_plan():
            async for chunk in AsyncIteratorWrapper(openai_response):
                delta = chunk.choices[0].delta
                content = getattr(delta, 'content', '') or ''
                learning_plan_buffer.append(content)
                if content:  # Only yield if content is not empty
                    yield content
            # After streaming is complete, create the vector database
            learning_plan = ''.join(learning_plan_buffer)
            user_vector_db_path = os.path.join(user_folder, "user_vector_db")
            # request.session['user_vector_db_path'] = user_vector_db_path
            user_dict[user_id]['user_vector_db_path'] = user_vector_db_path
            models['rag_system'].create_faiss_from_text(learning_plan, user_vector_db_path)
            # Uploading a new topic is succeeded, thus, flag clear_chat_history when simplifying..
            user_dict[user_id]['clear_chat_history'] = True

        # Prepare the response
        response = StreamingResponse(stream_learning_plan(), media_type="text/plain")
        response.headers['X-Classified-Topic'] = topic
        response.headers['Access-Control-Expose-Headers'] = 'X-Classified-Topic'
        return response
    except Exception as e:
        print(f'Error in /upload-pdf/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/topics/')
def get_topics():
    topics = get_all_topics('./dynamic_system_prompts')
    topics.append('General_Paraphrasing')  # Include General_Paraphrasing in the list
    return {'topics': topics}


@app.post('/confirm-topic/')
async def confirm_topic(request: Request, topic: str = Form(...)):
    request.session['prompt_key'] = topic.strip()
    if topic == 'General_Paraphrasing':
        ref_knowledge_path = "./RAG_DB/General_Reference-VS"
    else:
        ref_knowledge_path = get_ref_knowledge_path(path="./dynamic_system_prompts", topic=topic)

    # request.session['ref_knowledge_path'] = ref_knowledge_path
    user_id = get_user_id(request=request)
    # double check, actually, at this point, user must be surl in dictionary..
    initialize_user_dict(user_id=user_id)

    user_dict[user_id]['ref_knowledge_path'] = ref_knowledge_path
    return {'message': 'Topic confirmed and session updated.'}


def classify_topic(pdf_content):
    """
    This functions classifies the given pdf_content into the corresponding system prompt.
    :return:
    """
    # Dynamic prompt classifier
    system_prompt = get_dynamic_classifier_prompt(base_folder="./dynamic_system_prompts")
    prompt = f"""{system_prompt}{"Now, follow the given examples and classify the following content accordingly!"}{pdf_content}[/INST]"""
    topic = models['llm'].generate(prompt=prompt)['results'][0]['generated_text'].strip()

    # these changes for General Paraphrasing feature
    topic = topic.replace(".", "").strip()
    # Get the list of known topics
    known_topics = get_all_topics(base_folder='./dynamic_system_prompts')
    known_topics.append('General_Paraphrasing')

    # Validate the topic
    if topic not in known_topics:
        topic = 'General_Paraphrasing'

    # Set the reference knowledge path
    if topic == 'General_Paraphrasing':
        ref_knowledge_path = "./RAG_DB/General_Reference-VS"
    else:
        ref_knowledge_path = get_ref_knowledge_path(path="./dynamic_system_prompts", topic=topic)
    print('ref_knowledge_path: {}'.format(ref_knowledge_path))

    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("Prompt Classifier: {}".format(prompt))
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")

    print("###############################")
    print("Classified Topic: {}".format(topic))
    print("###############################")

    return topic, ref_knowledge_path


def get_all_topics(base_folder):
    topics = []
    for folder_name in os.listdir(base_folder):
        if folder_name == '__pycache__':
            continue
        full_folder_path = os.path.join(base_folder, folder_name)
        if os.path.isdir(full_folder_path):
            topics.append(folder_name)
    return topics


def get_ref_knowledge_path(path, topic):
    for folder_name in os.listdir(path):
        if folder_name == '___pycache__':
            continue
        full_folder_path = os.path.join(path, folder_name)
        if not os.path.isdir(full_folder_path):
            continue
        if folder_name in topic:
            ref_vs_path = os.path.join(full_folder_path, 'References-VS')
            return ref_vs_path
    return None


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


def create_learning_plan(content):
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

        # user_prompt = f"""
        # Please create a structured learning plan from the following content. Divide the plan into
        # sections of 200-300 words each, maintaining the original content and structure. Generate a JSON structure with the keys 'content_1', 'content_2', ..., 'content_n'. The values should be the sections.
        #
        # This is the content:
        # {content}
        # """
        user_prompt = f"""
                Please create a structured learning plan from the following content. Divide the plan into 
                sections of 200-300 words each, maintaining the original content and structure.

                This is the content:
                {content}
                """

        openai_response = models['openai_client'].chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.1,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            stream=True
        )

        # learning_plan = completion.choices[0].message.content
        #
        # # Remove JSON markdown if present
        # if learning_plan.startswith('```json') and learning_plan.endswith('```'):
        #     learning_plan = learning_plan[7:-3]  # Remove ```json from start and ```
        #
        # return learning_plan

        return openai_response  # 'response' is an iterator over the streamed chunks
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


# New endpoint for add new topic
@app.post("/add-topic/")
async def add_topic(
    request: Request,
    topic_name: str = Form(...),
    definition: str = Form(...),
    instruction: str = Form(...),
    examples: str = Form(...),  # This will be a JSON string
    references: List[UploadFile] = File(...)
):
    try:
        # Validate inputs
        errors = {}
        if not topic_name.strip():
            errors['topic_name'] = 'Topic Name is required'
        if not definition.strip():
            errors['definition'] = 'Definition is required'
        if not instruction.strip():
            errors['instruction'] = 'Instruction is required'
        if not examples.strip():
            errors['examples'] = 'Examples are required'
        if not references:
            errors['references'] = 'At least one reference PDF is required'
        if errors:
            return JSONResponse(content={'error': 'Validation errors', 'details': errors}, status_code=400)

        # Sanitize topic_name to prevent directory traversal
        sanitized_topic_name = "".join(c for c in topic_name if c.isalnum() or c in (' ', '_', '-')).rstrip()

        # Path to dynamic_system_prompts directory
        DYNAMIC_PROMPTS_DIR = './dynamic_system_prompts'  # Adjust the path if needed

        # Create the new topic directory
        topic_dir = os.path.join(DYNAMIC_PROMPTS_DIR, sanitized_topic_name)
        if os.path.exists(topic_dir):
            return JSONResponse(content={'error': f'Topic "{topic_name}" already exists.'}, status_code=400)
        try:
            os.makedirs(topic_dir)
        except Exception as e:
            return JSONResponse(content={'error': f'Failed to create topic directory: {str(e)}'}, status_code=500)

        # Save Definition.txt
        try:
            with open(os.path.join(topic_dir, 'Definition.txt'), 'w', encoding='utf-8') as f:
                f.write(definition)
        except Exception as e:
            return JSONResponse(content={'error': f'Failed to save Definition.txt: {str(e)}'}, status_code=500)

        # Save Instructions.txt
        try:
            with open(os.path.join(topic_dir, 'Instructions.txt'), 'w', encoding='utf-8') as f:
                f.write(instruction)
        except Exception as e:
            return JSONResponse(content={'error': f'Failed to save Instruction.txt: {str(e)}'}, status_code=500)

        # Save Examples.txt in the desired plain text format
        try:
            examples_list = json.loads(examples)
            examples_file_path = os.path.join(topic_dir, 'Examples.txt')
            with open(examples_file_path, 'w', encoding='utf-8') as f:
                for example in examples_list:
                    f.write(f"Input: {example['input']}\n")
                    f.write(f"Output: {example['output']}\n\n")
        except Exception as e:
            return JSONResponse(content={'error': f'Failed to save Examples.txt: {str(e)}'}, status_code=500)

        # Create References directory and save files
        try:
            references_dir = os.path.join(topic_dir, 'References')
            os.makedirs(references_dir)
            for file in references:
                file_location = os.path.join(references_dir, file.filename)
                with open(file_location, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            return JSONResponse(content={'error': f'Failed to save reference files: {str(e)}'}, status_code=500)

        # Now, build the vector store from the References PDFs
        try:
            # Define the embeddings path
            references_vs_dir = os.path.join(topic_dir, 'References-VS')

            # Initialize the embedding model
            embedding_model_id = "intfloat/multilingual-e5-large"
            embedding_model = SentenceTransformerEmbeddings(model_name=embedding_model_id)

            # Create the vector store
            vectorstore = PDFVectorStore(embedding_model, embeddings_path=references_vs_dir)
            vectorstore.add_pdf_folder_to_vectorstore(references_dir)

        except Exception as e:
            return JSONResponse(content={'error': f'Failed to create vector store for references: {str(e)}'}, status_code=500)

        # Return success message
        return {"message": f'The topic "{topic_name}" has been added successfully.'}

    except Exception as e:
        print(f'Error in /add-topic/ endpoint: {e}')
        raise HTTPException(status_code=500, detail=str(e))


def run_server(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    run_server()
############################

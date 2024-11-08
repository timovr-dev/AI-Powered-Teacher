# How to Install the ALLaM Teacher

## Add Environment Variables

The first step is to set the following environment variables:

- `ALLAM_WATSONX_KEY` and `ALLAM_PROJECT_ID`: Keys for authentication and project identification within WatsonX services.
- `SPEECH_KEY` and `SPEECH_REGION`: Key and region for Azure's Text-to-Speech (TTS) service.
- `OPENAI_API_KEY`: API key to access OpenAI's services.

```bash
export ALLAM_WATSONX_KEY=""
export ALLAM_PROJECT_ID=""
export SPEECH_KEY=""
export SPEECH_REGION=""
export OPENAI_API_KEY=""
```

## Frontend

Run the following commands to set up and run the React frontend:

```bash
# Step 1: Install dependencies
npm install

# Step 2: Start the development server (last version V15)
npm start
```

## Backend

Follow these steps to set up and run the project:

1. Create a new Conda environment with Python version 3.11 or higher (but not below 3.10, as pip might install an outdated ibmwatsonx package):

    ```bash
    conda create -n allam_teacher python=3.11
    ```

2. Activate the Conda environment:

    ```bash
    conda activate allam_teacher
    ```

3. Install the required packages from `requirements.txt`:

    ```bash
    pip install -r requirements.txt
    ```

4. For the speech-to-text functionality, install FFmpeg (a complete, cross-platform solution to record, convert, and stream audio and video). After building or downloading a built version, add its path to the system path in your OS (e.g., FFmpeg path):

    ```bash
    C:\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin
    ```

5. Run the main script with the FastAPI endpoint:

    ```bash
    python main_api_streaming_V15.py
    ```

    The last step might take some time because it needs to download models, such as the embedding model and models for detecting tables and figures in PDF content.


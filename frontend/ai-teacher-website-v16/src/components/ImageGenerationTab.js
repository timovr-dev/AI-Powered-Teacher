// components/ImageGenerationTab.js
import React, { useState, useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';

const ImageGenerationTab = ({
  config,
  selectedText,
  simplifiedText,
  generatedImage,
  setGeneratedImage,
  theme,
}) => {
  // For Speech to text
  const [recordingState, setRecordingState] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canceledRef = useRef(false);
  const isRecordingRef = useRef(false);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const textareaRef = useRef(null);
  const lineHeight = 24; // Approximate line height in pixels
  const maxLines = 3;
  const maxHeight = lineHeight * maxLines;

  useEffect(() => {
    if (simplifiedText) {
      setPrompt(simplifiedText);
    } else if (selectedText) {
      setPrompt(selectedText);
    }
  }, [simplifiedText, selectedText]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        maxHeight
      )}px`;
    }
  }, [prompt]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch('http://localhost:8000/generate-image/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          user_info: config,
        }),
        credentials: 'include', // Added credentials
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedImage(data.image_url);
    } catch (error) {
      console.error('Error generating image:', error);
      setGeneratedImage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Recording functions for Speech to Text
  const handleRecordToggle = () => {
    if (recordingState) {
      // Stop recording
      if (mediaRecorderRef.current) {
        console.log('Stopping recording');
        mediaRecorderRef.current.stop();
      }
      setRecordingState(false);
    } else {
      // Start recording
      if (isRecordingRef.current) {
        console.warn('Recording already in progress');
        return;
      }

      // Clean up any existing media recorder
      if (mediaRecorderRef.current) {
        console.log('Cleaning up old recorder');
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          console.log('Starting new recording');
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          canceledRef.current = false;
          isRecordingRef.current = true;

          mediaRecorder.start();
          setRecordingState(true);

          playRecordingTone();

          mediaRecorder.addEventListener('dataavailable', (event) => {
            console.log('dataavailable event fired');
            audioChunksRef.current.push(event.data);
          });

          mediaRecorder.addEventListener(
            'stop',
            () => {
              console.log('onstop event fired');
              isRecordingRef.current = false; // Recording stopped
              stream.getTracks().forEach((track) => track.stop());

              const audioBlob = new Blob(audioChunksRef.current, {
                type: 'audio/webm',
              });

              if (!canceledRef.current) {
                console.log('Calling transcribeAudio');
                transcribeAudio(audioBlob);
              }

              // Clean up
              audioChunksRef.current = [];
              mediaRecorderRef.current = null;
              canceledRef.current = false;
            },
            { once: true }
          );
        })
        .catch((err) => {
          console.error('Error accessing microphone:', err);
        });
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current) {
      canceledRef.current = true; // Set the canceled flag
      mediaRecorderRef.current.stop();
      setRecordingState(false);
      isRecordingRef.current = false; // Recording stopped
      // Clear the audio chunks
      audioChunksRef.current = [];
    }
  };

  const playRecordingTone = () => {
    // Simple beep sound
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 note
    oscillator.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2); // Play for 0.2 seconds
  };

  const transcribeAudio = (audioBlob) => {
    console.log('transcribeAudio called');

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    fetch('http://localhost:8000/transcribe/', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const transcription = data.transcription;
        console.log('Received transcription:', transcription);

        // Append transcription to the prompt
        setPrompt((prevPrompt) => {
          if (!prevPrompt.includes(transcription)) {
            console.log('Updating prompt');
            return prevPrompt + (prevPrompt ? ' ' : '') + transcription;
          } else {
            console.log('Transcription already present, skipping update');
            return prevPrompt;
          }
        });
      })
      .catch((error) => {
        console.error('Error transcribing audio:', error);
      });
  };

  return (
    <div className="flex flex-col h-full p-4" dir="rtl">
      <div className="flex flex-col mb-2">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter image prompt..."
          className={`w-full rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto shadow-sm ${
            theme === 'light'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-gray-700 text-gray-200'
          }`}
          rows={3}
          style={{ maxHeight: `${maxHeight}px` }}
          dir="rtl"
        ></textarea>
      </div>
      {/* Buttons */}
      <div className="flex justify-start mb-4" dir="ltr">
        <button
          onClick={handleRecordToggle}
          type="button"
          className={`px-4 py-2 rounded-md mr-2 ${
            recordingState ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
        >
          {recordingState ? 'Stop Recording' : 'Record'}
        </button>
        <button
          onClick={handleCancelRecording}
          type="button"
          className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2"
          disabled={!recordingState}
        >
          Cancel
        </button>
        <button
          onClick={handleGenerateImage}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors duration-200 shadow-md flex items-center"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </button>
      </div>
      {/* Display the generated image */}
      <div className="flex-grow overflow-y-auto">
        {generatedImage && (
          <div className="overflow-y-auto">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full rounded-lg shadow-md"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerationTab;

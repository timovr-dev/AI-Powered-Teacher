// components/HelpChat.js
import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


const HelpChat = ({ messages, setMessages, config, showClearButton = false, theme }) => {
  // for speech to text
  const [recordingState, setRecordingState] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canceledRef = useRef(false);
  const isRecordingRef = useRef(false);

  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const maxHeight = 240;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        maxHeight
      )}px`;
    }
  }, [inputMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsGenerating(true);

    const updatedMessages = [...messages, { text: userMessage, sender: 'user' }];
    setMessages(updatedMessages);

    try {
      const response = await fetch('http://localhost:8000/help-chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_history: updatedMessages.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
          user_info: config,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: '', sender: 'ai' },
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiResponse += chunk;
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].text = aiResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message to help chat backend:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "I'm sorry, I encountered an error while processing your request.",
          sender: 'ai',
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputMessage('');
  };

  // Recording functions for speech to text
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

      // Append transcription to the inputMessage
      setInputMessage((prevInputMessage) => {
        if (!prevInputMessage.includes(transcription)) {
          console.log('Updating inputMessage');
          return (
            prevInputMessage + (prevInputMessage ? ' ' : '') + transcription
          );
        } else {
          console.log('Transcription already present, skipping update');
          return prevInputMessage;
        }
      });
    })
    .catch((error) => {
      console.error('Error transcribing audio:', error);
    });
};

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && showClearButton && (
        <div className="flex justify-end p-2">
          <button
            onClick={handleClearChat}
            className="text-gray-500 hover:text-red-500 flex items-center"
          >
            <Trash2 size={16} className="mr-1" />
            Delete Chat
          </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto p-4 space-y-4" dir="rtl">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === 'user' ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                message.sender === 'user'
                  ? 'bg-blue-100 text-blue-800'
                  : theme === 'light'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        className={`bg-gray-200 text-red-600 rounded px-1 ${
                          className || ''
                        }`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200">
  <div className="flex flex-col">
    <div className="flex items-center mb-2">
      <textarea
        ref={textareaRef}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        className={`flex-grow rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto shadow-sm ${
          theme === 'light'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-gray-700 text-gray-200'
        }`}
        disabled={isGenerating}
        rows={1}
        style={{ maxHeight: `${maxHeight}px` }}
        dir="rtl"
      ></textarea>
      <button
        onClick={handleSendMessage}
        className="mr-3 text-blue-600 hover:text-blue-800 transition-colors duration-200"
        disabled={isGenerating}
      >
        <Send size={28} />
      </button>
    </div>
    {/* Record/Stop and Cancel Buttons */}
    <div className="flex justify-start">
      <button
        onClick={handleRecordToggle}
        type="button"
        className={`px-4 py-2 rounded-md mr-2 ${
          recordingState
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'
        }`}
      >
        {recordingState ? 'Stop Recording' : 'Record'}
      </button>
      <button
        onClick={handleCancelRecording}
        type="button"
        className="bg-gray-500 text-white px-4 py-2 rounded-md"
        disabled={!recordingState}
      >
        Cancel
      </button>
    </div>
  </div>
</div>

    </div>
  );
};

export default HelpChat;

// components/SimplifierTab.js
import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Volume2, VolumeX, MousePointerClick } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SimplifierTab = ({
  config,
  selectedText,
  messages,
  setMessages,
  simplifiedText,
  setSimplifiedText,
  theme,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInputBox, setShowInputBox] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const maxHeight = 240;

  useEffect(() => {
    if (selectedText) {
      setInputMessage(selectedText);
      setShowInputBox(true);
    } else if (messages.length === 0) {
      setInputMessage('');
      setShowInputBox(false);
    }
  }, [selectedText, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    // Stop any ongoing speech synthesis
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }

    const userMessage = inputMessage;
    setInputMessage('');
    setIsGenerating(true);

    const updatedMessages = [...messages, { text: userMessage, sender: 'user' }];
    setMessages(updatedMessages);

    try {
      const response = await fetch('http://localhost:8000/simplify/', {
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

      setSimplifiedText(aiResponse);
    } catch (error) {
      console.error('Error sending message to simplifier backend:', error);
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

  const handleToggleSpeech = async () => {
    if (isSpeaking) {
      // Stop the audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setIsSpeaking(false);
    } else {
      if (simplifiedText) {
        try {
          const synthResponse = await fetch('http://localhost:8000/synthesize/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: simplifiedText }),
            credentials: 'include',
          });

          if (synthResponse.ok) {
            const audioBlob = await synthResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play();
            setIsSpeaking(true);

            // Handle when audio ends
            audio.onended = () => {
              setIsSpeaking(false);
              audioRef.current = null;
            };
          } else {
            console.error('Error in synthesizing speech:', synthResponse.statusText);
          }
        } catch (error) {
          console.error('Error during speech synthesis:', error);
        }
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    // Stop any ongoing speech synthesis
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }

    setMessages([]);
    setInputMessage('');
    setSimplifiedText('');
    setShowInputBox(false);
  };

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && (
        <div className="flex justify-between items-center p-2">
          <button
            onClick={handleClearChat}
            className="text-gray-500 hover:text-red-500 flex items-center"
          >
            <Trash2 size={16} className="mr-1" />
            Delete Chat
          </button>
          {/* Button for "Read" / "Stop reading" */}
          <button
            onClick={handleToggleSpeech}
            className={`flex items-center text-gray-500 hover:text-blue-600 ${
              !simplifiedText ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!simplifiedText}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={16} className="mr-1" />
                Stop reading
              </>
            ) : (
              <>
                <Volume2 size={16} className="mr-1" />
                Read
              </>
            )}
          </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto p-4 space-y-4" dir="rtl">
        {messages.length === 0 && !showInputBox && (
          <div className="flex flex-col items-center justify-center h-full">
            <MousePointerClick size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-xl font-semibold text-center">
              Select some text to simplify
            </p>
          </div>
        )}
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
      {showInputBox && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
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
        </div>
      )}
    </div>
  );
};

export default SimplifierTab;

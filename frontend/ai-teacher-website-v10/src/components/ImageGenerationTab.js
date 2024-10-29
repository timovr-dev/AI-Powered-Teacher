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
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const textareaRef = useRef(null);
  const maxHeight = 240;

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

  return (
    <div className="p-6 flex flex-col h-full" dir="rtl">
      <div className="flex items-center">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter image prompt..."
          className={`flex-grow rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto shadow-sm ${
            theme === 'light'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-gray-700 text-gray-200'
          }`}
          rows={1}
          style={{ maxHeight: `${maxHeight}px` }}
          dir="rtl"
        ></textarea>
        <button
          onClick={handleGenerateImage}
          className="mr-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors duration-200 shadow-md flex items-center"
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
      {generatedImage && (
        <div
            className="mt-6 overflow-y-auto"
            style={{ maxHeight: '800px' }} // You can adjust '400px' to your desired max height
        >
            <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-lg shadow-md"
            />
        </div>
      )}
    </div>
  );
};
export default ImageGenerationTab;

// components/HelperWindow.js
import React, { useState } from 'react';
import SimplifierTab from './SimplifierTab';
import HelpChat from './HelpChat';
import ImageGenerationTab from './ImageGenerationTab';

const HelperWindow = ({
  config,
  helpChatMessages,
  setHelpChatMessages,
  simplifierMessages,
  setSimplifierMessages,
  selectedText,
  simplifiedText,
  setSimplifiedText,
  isHelperVisible,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState('Simplifier');
  const [generatedImage, setGeneratedImage] = useState(null);

  return (
    <div
      className={`fixed top-1/2 right-0 transform -translate-y-1/2 ${
        isHelperVisible ? 'translate-x-0' : 'translate-x-full'
      } h-3/4 w-full lg:w-1/3 ${
        theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'
      } border-l ${
        theme === 'light' ? 'border-gray-200' : 'border-gray-700'
      } flex flex-col z-40 rounded-l-lg shadow-lg transition-transform duration-300`}
    >
      <div className="flex">
        {['Simplifier', 'Search Document', 'Visual Mnemonics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 p-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === tab
                ? theme === 'light'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'border-b-2 border-blue-300 text-blue-300'
                : theme === 'light'
                ? 'text-gray-600 hover:text-blue-600'
                : 'text-gray-300 hover:text-blue-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-grow overflow-hidden">
        {activeTab === 'Simplifier' && (
          <SimplifierTab
            config={config}
            selectedText={selectedText}
            messages={simplifierMessages}
            setMessages={setSimplifierMessages}
            simplifiedText={simplifiedText}
            setSimplifiedText={setSimplifiedText}
            theme={theme}
          />
        )}
        {activeTab === 'Search Document' && (
          <HelpChat
            messages={helpChatMessages}
            setMessages={setHelpChatMessages}
            config={config}
            showClearButton={true}
            theme={theme}
          />
        )}
        {activeTab === 'Visual Mnemonics' && (
          <ImageGenerationTab
            config={config}
            selectedText={selectedText}
            simplifiedText={simplifiedText}
            generatedImage={generatedImage}
            setGeneratedImage={setGeneratedImage}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
};

export default HelperWindow;

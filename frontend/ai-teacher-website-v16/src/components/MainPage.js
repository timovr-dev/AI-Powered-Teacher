// components/MainPage.js
import React from 'react';
import UploadPage from './UploadPage';
import HelperWindow from './HelperWindow';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const MainPage = ({
  config,
  setConfig,
  theme,
  helpChatMessages,
  setHelpChatMessages,
  simplifierMessages,
  setSimplifierMessages,
  selectedText,
  setSelectedText,
  uploadedText,
  setUploadedText,
  simplifiedText,
  setSimplifiedText,
  isHelperVisible,
  setIsHelperVisible,
}) => {
  const toggleHelperWindow = () => {
    setIsHelperVisible(!isHelperVisible);
  };

  return (
    <div className="flex flex-grow h-full relative">
      {/* Left Content */}
      <div
        className={`h-full flex flex-col transition-all duration-300 ${
          isHelperVisible ? 'w-full lg:w-2/3' : 'w-full'
        }`}
      >
        <UploadPage
          config={config}
          setSelectedText={setSelectedText}
          uploadedText={uploadedText}
          setUploadedText={setUploadedText}
          theme={theme}
        />
      </div>
      {/* Right Content */}
      <div className="hidden lg:block">
        <HelperWindow
          config={config}
          helpChatMessages={helpChatMessages}
          setHelpChatMessages={setHelpChatMessages}
          simplifierMessages={simplifierMessages}
          setSimplifierMessages={setSimplifierMessages}
          selectedText={selectedText}
          simplifiedText={simplifiedText}
          setSimplifiedText={setSimplifiedText}
          isHelperVisible={isHelperVisible}
          theme={theme}
        />
      </div>
      {/* Toggle Button */}
      <button
        onClick={toggleHelperWindow}
        className={`fixed top-1/2 right-0 transform ${
          isHelperVisible ? '-translate-x-full' : 'translate-x-0'
        } -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-500 transition-transform duration-300 z-50`}
      >
        {isHelperVisible ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
      </button>
    </div>
  );
};

export default MainPage;

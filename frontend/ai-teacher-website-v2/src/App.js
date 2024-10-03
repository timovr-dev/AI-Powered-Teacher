import React, { useState, useRef, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  useLocation,
} from 'react-router-dom';
import {
  Send,
  BookOpen,
  Sliders,
  Info,
  Upload,
  MousePointerClick,
  Trash2,
  User,
  ArrowLeft,
  ArrowRight,
  Loader,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';



const App = () => {
  const [config, setConfig] = useState({
    explanation_complexity: 50,
    teaching_style: 'Neutral',
    occupation: '',
    learning_goal: '',
    learning_style: 'Visual',
    interests: '',
  });

  const [helpChatMessages, setHelpChatMessages] = useState([
    { text: 'Ask me anything about your learning plan!', sender: 'ai' },
  ]);

  const [simplifierMessages, setSimplifierMessages] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [uploadedText, setUploadedText] = useState('');
  const [isHelperVisible, setIsHelperVisible] = useState(true);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white text-gray-800">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <img
                    src="/logo_black.png"
                    alt="Logo"
                    className="h-14 w-auto object-contain transition-transform duration-300 ease-in-out hover:scale-105"
                  />
                  <div className="ml-3 flex flex-col">
                    <span className="text-sm text-gray-500">presents</span>
                    <span className="text-xl font-bold text-gray-800">
                      ALLaM-Powered Teacher
                    </span>
                  </div>
                </Link>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-6">
                  <NavButton to="/" icon={<BookOpen size={20} />} label="Learn" />
                  <NavButton
                    to="/config"
                    icon={<Sliders size={20} />}
                    label="Configure"
                  />
                  <NavButton to="/about" icon={<Info size={20} />} label="About Us" />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow p-6 overflow-hidden">
          <Switch>
            <Route exact path="/">
              <MainPage
                config={config}
                helpChatMessages={helpChatMessages}
                setHelpChatMessages={setHelpChatMessages}
                simplifierMessages={simplifierMessages}
                setSimplifierMessages={setSimplifierMessages}
                selectedText={selectedText}
                setSelectedText={setSelectedText}
                uploadedText={uploadedText}
                setUploadedText={setUploadedText}
                isHelperVisible={isHelperVisible}
                setIsHelperVisible={setIsHelperVisible}
              />
            </Route>
            <Route path="/config">
              <ConfigPage config={config} setConfig={setConfig} />
            </Route>
            <Route path="/about" component={AboutPage} />
          </Switch>
        </main>
        <footer className="bg-white text-gray-500 text-center py-4 text-sm">
          <p>&copy; 2024 AI-Powered Teacher by MozaicAI Solutions.</p>
        </footer>
      </div>
    </Router>
  );
};

const NavButton = ({ to, icon, label }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        active
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Link>
  );
};

const MainPage = ({
  config,
  helpChatMessages,
  setHelpChatMessages,
  simplifierMessages,
  setSimplifierMessages,
  selectedText,
  setSelectedText,
  uploadedText,
  setUploadedText,
  isHelperVisible,
  setIsHelperVisible,
}) => {
  const [simplifiedText, setSimplifiedText] = useState('');

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
          toggleHelperWindow={toggleHelperWindow}
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
  toggleHelperWindow,
}) => {
  const [activeTab, setActiveTab] = useState('Simplifier');
  const [generatedImage, setGeneratedImage] = useState(null);

  return (
    <div
      className={`fixed top-1/2 right-0 transform -translate-y-1/2 ${
        isHelperVisible ? 'translate-x-0' : 'translate-x-full'
      } h-3/4 w-full lg:w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col z-40 rounded-l-lg shadow-lg transition-transform duration-300`}
    >
      <div className="flex">
        {['Simplifier', 'Search Document', 'Visual Mnemonics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 p-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
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
            setSimplifiedText={setSimplifiedText}
          />
        )}
        {activeTab === 'Search Document' && (
          <HelpChat
            messages={helpChatMessages}
            setMessages={setHelpChatMessages}
            config={config}
            showClearButton={true}
          />
        )}
        {activeTab === 'Visual Mnemonics' && (
          <ImageGenerationTab
            config={config}
            selectedText={selectedText}
            simplifiedText={simplifiedText}
            generatedImage={generatedImage}
            setGeneratedImage={setGeneratedImage}
          />
        )}
      </div>
    </div>
  );
};


const UploadPage = ({
  config,
  setSelectedText,
  uploadedText,
  setUploadedText,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (file) {
      setIsUploading(true);
      setUploadedFileName(file.name);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify(config));

      try {
        const response = await fetch('http://localhost:8000/upload-pdf/', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const uploadedMarkdown = data['learn-content'];
        setUploadedText(uploadedMarkdown);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setIsUploading(false);
        setUploadedFileName('');
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleMouseUp = (event) => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
      setSelectedText(selectedText);
    } else {
      setSelectedText('');
    }
  };

  const handleClearLearningPlan = () => {
    setUploadedText('');
    setSelectedText('');
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div
      className="relative flex flex-col h-full w-full overflow-hidden bg-white"
      onMouseUp={handleMouseUp}
    >
      {!uploadedText && (
        <div className="flex flex-col items-center justify-center h-full">
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <div
            className={`border border-gray-200 rounded-lg shadow-sm p-8 flex flex-col items-center cursor-pointer transition-colors duration-300 ${
              isDragging ? 'bg-blue-50 border-blue-300' : 'bg-white'
            }`}
            style={{ width: '100%', maxWidth: '500px' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadButtonClick}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Upload Learning Content
            </h2>
            <div className="bg-blue-100 rounded-full p-6 mb-6">
              <Upload size={48} className="text-blue-600" />
            </div>
            <p className="text-gray-600 mb-4 text-center">
              Upload your Learning Content Here
            </p>
            <p className="text-gray-400 mb-6">Supported file types: PDF</p>
            <button
              onClick={handleUploadButtonClick}
              className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-sm hover:shadow-md"
            >
              Browse Files
            </button>
            <p className="mt-4 text-gray-400 text-sm">Max file size: 2MB</p>
          </div>
          {isUploading && (
            <div className="mt-8 flex items-center bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-4">
              <Loader size={24} className="animate-spin text-blue-600 mr-4" />
              <span className="text-gray-700 font-medium">
                Generating custom learning plan based on {uploadedFileName}...
              </span>
            </div>
          )}
        </div>
      )}
      {uploadedText && (
        <div className="mx-auto p-8 bg-white border border-gray-200 rounded-lg shadow-sm relative mt-8 max-w-4xl w-full">
          <button
            onClick={handleClearLearningPlan}
            className="absolute top-4 right-4 bg-red-50 text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors duration-300"
          >
            <Trash2 size={20} />
          </button>
          <div className="prose lg:prose-lg w-full mt-4">
            <ReactMarkdown
              children={uploadedText}
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
                      className={`bg-gray-100 text-red-600 rounded px-1 ${
                        className || ''
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};







const HelpChat = ({
  messages,
  setMessages,
  config,
  showClearButton = false,
}) => {
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

    const updatedMessages = [
      ...messages,
      { text: userMessage, sender: 'user' },
    ];
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

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && showClearButton && (
        <div className="flex justify-end p-2">
          <button
            onClick={handleClearChat}
            className="text-gray-500 hover:text-red-500 flex items-center"
          >
            <Trash2 size={16} className="mr-1" />
            Clear Chat
          </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                message.sender === 'user'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
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
        <div className="flex items-center">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-grow bg-gray-100 text-gray-800 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto shadow-sm"
            disabled={isGenerating}
            rows={1}
            style={{ maxHeight: `${maxHeight}px` }}
          ></textarea>
          <button
            onClick={handleSendMessage}
            className="ml-3 text-blue-600 hover:text-blue-800 transition-colors duration-200"
            disabled={isGenerating}
          >
            <Send size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SimplifierTab = ({
  config,
  selectedText,
  messages,
  setMessages,
  setSimplifiedText,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInputBox, setShowInputBox] = useState(false);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsGenerating(true);

    const updatedMessages = [
      ...messages,
      { text: userMessage, sender: 'user' },
    ];
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputMessage('');
    setShowInputBox(false);
  };

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && (
        <div className="flex justify-end p-2">
          <button
            onClick={handleClearChat}
            className="text-gray-500 hover:text-red-500 flex items-center"
          >
            <Trash2 size={16} className="mr-1" />
            Clear Chat
          </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
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
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                message.sender === 'user'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
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
              className="flex-grow bg-gray-100 text-gray-800 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto shadow-sm"
              disabled={isGenerating}
              rows={1}
              style={{ maxHeight: `${maxHeight}px` }}
            ></textarea>
            <button
              onClick={handleSendMessage}
              className="ml-3 text-blue-600 hover:text-blue-800 transition-colors duration-200"
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

const ImageGenerationTab = ({
  config,
  selectedText,
  simplifiedText,
  generatedImage,
  setGeneratedImage,
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
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter image prompt..."
          className="flex-grow bg-gray-100 text-gray-800 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto shadow-sm"
          rows={1}
          style={{ maxHeight: `${maxHeight}px` }}
        ></textarea>
        <button
          onClick={handleGenerateImage}
          className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors duration-200 shadow-md flex items-center"
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
        <div className="mt-6">
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

const ConfigPage = ({ config, setConfig }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 mt-6">
      <h2 className="text-3xl font-semibold mb-8 text-gray-800">
        Personalize Your Teacher
      </h2>
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explanation Complexity: {config.explanation_complexity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            name="explanation_complexity"
            value={config.explanation_complexity}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teaching Style
          </label>
          <select
            name="teaching_style"
            value={config.teaching_style}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-3 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option>Neutral</option>
            <option>Enthusiastic</option>
            <option>Socratic</option>
            <option>Strict</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occupation
          </label>
          <input
            type="text"
            name="occupation"
            value={config.occupation}
            onChange={handleChange}
            placeholder="e.g., Student, Engineer, Teacher"
            className="mt-1 block w-full pl-3 pr-10 py-3 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Goal
          </label>
          <input
            type="text"
            name="learning_goal"
            value={config.learning_goal}
            onChange={handleChange}
            placeholder="e.g., Master Python, Understand Quantum Physics"
            className="mt-1 block w-full pl-3 pr-10 py-3 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Style
          </label>
          <select
            name="learning_style"
            value={config.learning_style}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-3 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option>Visual</option>
            <option>Auditory</option>
            <option>Reading/Writing</option>
            <option>Kinesthetic</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interests (comma-separated)
          </label>
          <input
            type="text"
            name="interests"
            value={config.interests}
            onChange={handleChange}
            placeholder="e.g., Technology, History, Arts"
            className="mt-1 block w-full pl-3 pr-10 py-3 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          />
        </div>
      </div>
    </div>
  );
};

const AboutPage = () => {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 mt-6">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">
        About AI-Powered Teacher
      </h2>
      <p className="mb-6 text-gray-700 leading-relaxed">
        AI-Powered Teacher is an innovative platform designed to revolutionize
        the way we learn. By harnessing the power of artificial intelligence, we
        provide personalized, adaptive learning experiences tailored to each
        student's unique needs and learning style.
      </p>
      <p className="mb-6 text-gray-700 leading-relaxed">
        Our mission is to make high-quality education accessible to everyone,
        anywhere, at any time. We believe that with the right tools and support,
        every learner can achieve their full potential.
      </p>
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">
        Key Features:
      </h3>
      <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
        <li>Personalized learning paths</li>
        <li>Real-time feedback and assessment</li>
        <li>Adaptive difficulty levels</li>
        <li>24/7 availability</li>
        <li>Multi-subject expertise</li>
      </ul>
      <p className="text-gray-700 leading-relaxed">
        Join us on this exciting journey to transform education and empower
        learners worldwide!
      </p>
    </div>
  );
};

export default App;
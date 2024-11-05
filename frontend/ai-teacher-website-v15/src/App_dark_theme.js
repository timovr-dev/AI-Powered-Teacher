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
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Import remark-gfm
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

  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-900 text-gray-200">
        <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-auto sm:h-10 md:h-12 lg:h-14 object-contain transition-all duration-300 ease-in-out hover:scale-105"
                />
                <div className="ml-3 sm:ml-1 flex items-baseline">
                  <span className="text-sm font-medium text-gray-400 mr-2">
                    presents
                  </span>
                  <span className="text-xl font-bold text-white">
                    ALLaM-Powered Teacher
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-baseline space-x-4">
                  <NavButton
                    to="/"
                    icon={<BookOpen size={18} />}
                    label="Learn"
                  />
                  <NavButton
                    to="/config"
                    icon={<Sliders size={18} />}
                    label="Configure"
                  />
                  <NavButton
                    to="/about"
                    icon={<Info size={18} />}
                    label="About"
                  />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow p-4 overflow-hidden">
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
              />
            </Route>
            <Route path="/config">
              <ConfigPage config={config} setConfig={setConfig} />
            </Route>
            <Route path="/about" component={AboutPage} />
          </Switch>
        </main>
        <footer className="bg-gray-800 text-gray-400 text-center p-4 text-sm">
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
      className={`flex items-center px-3 py-2 rounded text-sm font-medium ${
        active
          ? 'text-blue-400 bg-gray-700'
          : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'
      } transition-colors duration-200`}
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
}) => {
  const [simplifiedText, setSimplifiedText] = useState('');

  return (
    <div className="flex flex-grow h-full">
      <div className="w-2/3 h-full flex flex-col">
        <UploadPage
          config={config}
          setSelectedText={setSelectedText}
          uploadedText={uploadedText}
          setUploadedText={setUploadedText}
        />
      </div>
      <div className="w-1/3 h-full flex flex-col">
        <HelperWindow
          config={config}
          helpChatMessages={helpChatMessages}
          setHelpChatMessages={setHelpChatMessages}
          simplifierMessages={simplifierMessages}
          setSimplifierMessages={setSimplifierMessages}
          selectedText={selectedText}
          simplifiedText={simplifiedText}
          setSimplifiedText={setSimplifiedText}
        />
      </div>
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
}) => {
  const [activeTab, setActiveTab] = useState('Simplifier');
  const [generatedImage, setGeneratedImage] = useState(null);

  return (
    <div className="h-full bg-gray-800 text-gray-200 flex flex-col border-l border-gray-700">
      <div className="flex">
        {['Simplifier', 'Search Document', 'Visual Mnemonics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 p-2 ${
              activeTab === tab
                ? 'bg-gray-700 text-white'
                : 'bg-gray-600 text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-grow overflow-auto">
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
  const fileInputRef = useRef(null);

  // You can adjust this value to change the width of the content
  const contentWidthPercentage = 80; // percentage of the parent container's width

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
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
      }
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleMouseUp = (event) => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    // Attempt to get markdown from selection
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

  return (
    <div
      className="relative flex flex-col h-full w-full overflow-y-auto"
      onMouseUp={handleMouseUp}
    >
      {!uploadedText && (
        <div className="flex flex-col items-center justify-center h-full">
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleUploadButtonClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-500 transition-colors duration-200 flex items-center"
          >
            <Upload size={24} className="mr-2" />
            {isUploading ? 'Uploading...' : 'Upload PDF Document'}
          </button>
          <p className="mt-4 text-gray-400 text-center max-w-md">
            Upload a PDF document to create a customized learning plan
            tailored just for you.
          </p>
        </div>
      )}
      {uploadedText && (
        <div
          className="mx-auto p-4 bg-gray-800 rounded relative"
          style={{ width: `${contentWidthPercentage}%` }}
        >
          <button
            onClick={handleClearLearningPlan}
            className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded hover:bg-red-500 flex items-center"
          >
            <Trash2 size={16} className="mr-1" />
          </button>
          <div
            className="prose prose-invert lg:prose-lg w-full mt-8"
            style={{
              maxWidth: 'none', // Override Tailwind prose max-width
              width: '100%', // Ensure full width
            }}
          >
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
                      className={`bg-gray-700 text-red-400 rounded px-1 ${
                        className || ''
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <p style={{ maxWidth: 'none' }}>{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 style={{ maxWidth: 'none' }}>{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ maxWidth: 'none' }}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ maxWidth: 'none' }}>{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 style={{ maxWidth: 'none' }}>{children}</h4>
                ),
                h5: ({ children }) => (
                  <h5 style={{ maxWidth: 'none' }}>{children}</h5>
                ),
                h6: ({ children }) => (
                  <h6 style={{ maxWidth: 'none' }}>{children}</h6>
                ),
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
  const maxHeight = 240; // Max height in pixels (approx 10 lines)

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
        headers: {
          'Content-Type': 'application/json',
        },
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
            className="text-gray-400 hover:text-red-500 flex items-center"
          >
            <Trash2 size={16} className="mr-1" />
            Clear Chat
          </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            } mb-2`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-2 ${
                message.sender === 'user'
                  ? 'bg-blue-800 text-blue-100'
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
                        className={`bg-gray-200 text-red-500 rounded px-1 ${
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
      <div className="p-2">
        <div className="flex items-center">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-grow bg-gray-700 text-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
            disabled={isGenerating}
            rows={1}
            style={{ maxHeight: `${maxHeight}px` }}
          ></textarea>
          <button
            onClick={handleSendMessage}
            className="ml-2 text-gray-200 hover:text-blue-500"
            disabled={isGenerating}
          >
            <Send size={24} />
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
  const maxHeight = 240; // Max height in pixels (approx 10 lines)

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

    const updatedMessages = [...messages, { text: userMessage, sender: 'user' }];
    setMessages(updatedMessages);

    try {
      const response = await fetch('http://localhost:8000/simplify/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Copy the simplified text to the Visual Mnemonics tab
      setSimplifiedText(aiResponse);

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
    setShowInputBox(false);
  };

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && (
        <div className="flex justify-end p-2">
          <button
            onClick={handleClearChat}
            className="text-gray-400 hover:text-red-500 flex items-center"
          >
            <Trash2 size={16} className="mr-1" />
            Clear Chat
          </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.length === 0 && !showInputBox && (
          <div className="flex flex-col items-center justify-center h-full">
            <MousePointerClick size={48} className="text-gray-500 mb-4" />
            <p className="text-gray-400 text-xl font-semibold text-center">
              Select some text to simplify
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            } mb-2`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-2 ${
                message.sender === 'user'
                  ? 'bg-blue-800 text-blue-100'
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
                        className={`bg-gray-200 text-red-500 rounded px-1 ${
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
        <div className="p-2">
          <div className="flex items-center">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-grow bg-gray-700 text-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
              disabled={isGenerating}
              rows={1}
              style={{ maxHeight: `${maxHeight}px` }}
            ></textarea>
            <button
              onClick={handleSendMessage}
              className="ml-2 text-gray-200 hover:text-blue-500"
              disabled={isGenerating}
            >
              <Send size={24} />
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
  const maxHeight = 240; // Max height in pixels (approx 10 lines)

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
        headers: {
          'Content-Type': 'application/json',
        },
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
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter image prompt..."
          className="flex-grow bg-gray-700 text-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
          rows={1}
          style={{ maxHeight: `${maxHeight}px` }}
        ></textarea>
        <button
          onClick={handleGenerateImage}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Visual Mnemonic'}
        </button>
      </div>
      {generatedImage && (
        <div className="mt-4">
          <img src={generatedImage} alt="Generated" className="w-full rounded" />
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
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6 text-gray-200">
        Personalize Your Teacher
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Explanation Complexity: {config.explanation_complexity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            name="explanation_complexity"
            value={config.explanation_complexity}
            onChange={handleChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Teaching Style
          </label>
          <select
            name="teaching_style"
            value={config.teaching_style}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-200"
          >
            <option>Neutral</option>
            <option>Enthusiastic</option>
            <option>Socratic</option>
            <option>Strict</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Occupation
          </label>
          <input
            type="text"
            name="occupation"
            value={config.occupation}
            onChange={handleChange}
            placeholder="e.g., Student, Engineer, Teacher"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Learning Goal
          </label>
          <input
            type="text"
            name="learning_goal"
            value={config.learning_goal}
            onChange={handleChange}
            placeholder="e.g., Master Python, Understand Quantum Physics"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Learning Style
          </label>
          <select
            name="learning_style"
            value={config.learning_style}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-200"
          >
            <option>Visual</option>
            <option>Auditory</option>
            <option>Reading/Writing</option>
            <option>Kinesthetic</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Interests (comma-separated)
          </label>
          <input
            type="text"
            name="interests"
            value={config.interests}
            onChange={handleChange}
            placeholder="e.g., Technology, History, Arts"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-200"
          />
        </div>
      </div>
    </div>
  );
};

const AboutPage = () => {
  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h2 className="text-2xl font-semibold mb-4 text-gray-200">
        About AI-Powered Teacher
      </h2>
      <p className="mb-4 text-gray-300">
        AI-Powered Teacher is an innovative platform designed to revolutionize
        the way we learn. By harnessing the power of artificial intelligence,
        we provide personalized, adaptive learning experiences tailored to each
        student's unique needs and learning style.
      </p>
      <p className="mb-6 text-gray-300">
        Our mission is to make high-quality education accessible to everyone,
        anywhere, at any time. We believe that with the right tools and
        support, every learner can achieve their full potential.
      </p>
      <h3 className="text-xl font-semibold mb-2 text-gray-200">
        Key Features:
      </h3>
      <ul className="list-disc pl-5 mb-6 text-gray-300 space-y-1">
        <li>Personalized learning paths</li>
        <li>Real-time feedback and assessment</li>
        <li>Adaptive difficulty levels</li>
        <li>24/7 availability</li>
        <li>Multi-subject expertise</li>
      </ul>
      <p className="text-gray-300">
        Join us on this exciting journey to transform education and empower
        learners worldwide!
      </p>
    </div>
  );
};

export default App;
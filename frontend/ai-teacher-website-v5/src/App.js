import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, UploadIcon } from '@heroicons/react/solid';
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
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Plus,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  materialLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div
        className={`flex flex-col min-h-screen ${
          theme === 'light'
            ? 'bg-white text-gray-800'
            : 'bg-gray-900 text-gray-100'
        }`}
      >
        <nav
          className={`${
            theme === 'light' ? 'bg-white' : 'bg-gray-800'
          } shadow-md`}
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <img
                    src={
                      theme === 'light' ? '/logo_black.png' : '/logo_white.png'
                    }
                    alt="Logo"
                    className="h-14 w-auto object-contain transition-transform duration-300 ease-in-out hover:scale-105"
                  />
                  <div className="ml-3 flex flex-col">
                    <span
                      className={`text-sm ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-300'
                      }`}
                    >
                      presents
                    </span>
                    <span
                      className={`text-xl font-bold ${
                        theme === 'light' ? 'text-gray-800' : 'text-gray-100'
                      }`}
                    >
                      ALLaM-Powered Teacher
                    </span>
                  </div>
                </Link>
              </div>
              <div className="hidden sm:flex items-center space-x-6">
                <NavButton
                  to="/"
                  icon={<BookOpen size={20} />}
                  label="Learn"
                  theme={theme}
                />
                <NavButton
                  to="/config"
                  icon={<Sliders size={20} />}
                  label="Configure"
                  theme={theme}
                />
                <NavButton
                  to="/add-topic"
                  icon={<Plus size={20} />}
                  label="Add Topic"
                  theme={theme}
                />
                <NavButton
                  to="/about"
                  icon={<Info size={20} />}
                  label="About Us"
                  theme={theme}
                />
                <button
                  onClick={toggleTheme}
                  className={`text-gray-600 hover:text-blue-600 transition-colors duration-200 ${
                    theme === 'dark' ? 'text-gray-300 hover:text-blue-300' : ''
                  }`}
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
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
                theme={theme}
              />
            </Route>
            <Route path="/config">
              <ConfigPage config={config} setConfig={setConfig} theme={theme} />
            </Route>
              <Route path="/add-topic">
              <AddTopicPage theme={theme} />
            </Route>
            <Route path="/about">
              <AboutPage theme={theme} />
            </Route>
          </Switch>
        </main>
        <footer
          className={`${
            theme === 'light'
              ? 'bg-white text-gray-500'
              : 'bg-gray-800 text-gray-400'
          } text-center py-4 text-sm`}
        >
          <p>&copy; 2024 ALLaM-Powered Teacher by MozaicAI Solutions.</p>
        </footer>
      </div>
    </Router>
  );
};

const NavButton = ({ to, icon, label, theme }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        active
          ? theme === 'light'
            ? 'text-blue-600 bg-blue-50'
            : 'text-blue-300 bg-gray-700'
          : theme === 'light'
          ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          : 'text-gray-300 hover:text-blue-300 hover:bg-gray-700'
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
  theme,
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
          toggleHelperWindow={toggleHelperWindow}
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

const UploadPage = ({
  config,
  setSelectedText,
  uploadedText,
  setUploadedText,
  theme,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  // New state variables for topic confirmation
  const [classifiedTopic, setClassifiedTopic] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showTopicConfirmation, setShowTopicConfirmation] = useState(false);


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
        credentials: 'include', // Added credentials
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const uploadedMarkdown = data['learn-content'];
      const classifiedTopic = data['classified_topic'];
      setUploadedText(uploadedMarkdown);
      setClassifiedTopic(classifiedTopic);
      setSelectedTopic(classifiedTopic);

      // Fetch topics from backend
      await fetchTopics();
      setShowTopicConfirmation(true);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      setUploadedFileName('');
    }
  }
};

  const fetchTopics = async () => {
  try {
    const response = await fetch('http://localhost:8000/topics/', {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setTopics(data.topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
  }
};

const handleConfirmTopic = async () => {
  try {
    const formData = new FormData();
    formData.append('topic', selectedTopic);
    const response = await fetch('http://localhost:8000/confirm-topic/', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data.message);
    // Close the modal
    setShowTopicConfirmation(false);
  } catch (error) {
    console.error('Error confirming topic:', error);
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

  // Define custom styles for the upload area when dragging in dark mode
  const getUploadAreaStyles = () => {
    if (isDragging) {
      if (theme === 'dark') {
        return { backgroundColor: 'rgb(50, 61, 77)', borderColor: '#7F9CF5' }; // Adjust borderColor as needed
      } else {
        return {}; // Light mode styles are handled via Tailwind classes
      }
    }
    return {};
  };
return (
  <div
    className={`relative flex flex-col h-full w-full overflow-hidden ${
      theme === 'light' ? 'bg-white' : 'bg-gray-900'
    }`}
    onMouseUp={handleMouseUp}
  >
    {/* Confirmation Modal */}
    {showTopicConfirmation && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div
          className={`rounded-2xl p-8 ${
            theme === 'light'
              ? 'bg-white text-gray-800'
              : 'bg-gray-800 text-gray-100'
          } shadow-lg transform transition-all sm:max-w-lg sm:w-full`}
        >
          <h2
            className={`text-2xl font-bold mb-6 ${
              theme === 'light' ? 'text-gray-800' : 'text-gray-100'
            }`}
          >
            {classifiedTopic !== 'General_Paraphrasing' ? (
              'ALLAM has identified a topic for the PDF you uploaded. Please review the topic and adjust it if necessary!'
            ) : (
              'ALLAM couldn’t match your PDF with a specific topic. Below are the available topics. If your PDF fits one of them, feel free to select it, or request your teacher to add materials for this new topic!'
            )}
          </h2>

          <form className="space-y-3 max-h-60 overflow-y-auto">
            {topics.map((topic) => (
              <label
                key={topic}
                className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                  selectedTopic === topic
                    ? theme === 'light'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-blue-600 border-blue-500'
                    : theme === 'light'
                    ? 'bg-white border-gray-300 hover:bg-gray-50'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="topic"
                  value={topic}
                  checked={selectedTopic === topic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="hidden"
                />
                <span
                  className={`ml-2 ${
                    selectedTopic === topic
                      ? theme === 'light'
                        ? 'text-blue-600 font-medium'
                        : 'text-white font-medium'
                      : theme === 'light'
                      ? 'text-gray-800'
                      : 'text-gray-200'
                  }`}
                >
                  {topic}
                </span>
              </label>
            ))}
          </form>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleConfirmTopic}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )}

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
          className={`border rounded-lg shadow-sm p-8 flex flex-col items-center cursor-pointer transition-colors duration-300 ${
            isDragging
              ? theme === 'light'
                ? 'bg-blue-50 border-blue-300'
                : 'border-blue-500'
              : theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-800 border-gray-700'
          }`}
          style={{
            width: '100%',
            maxWidth: '500px',
            ...(isDragging && theme === 'dark' ? getUploadAreaStyles() : {}),
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadButtonClick}
        >
          <h2
            className={`text-3xl font-bold mb-6 ${
              theme === 'light' ? 'text-gray-800' : 'text-gray-100'
            }`}
          >
            Upload Learning Content
          </h2>
          <div
            className={`${
              theme === 'light' ? 'bg-blue-100' : 'bg-blue-600'
            } rounded-full p-6 mb-6`}
          >
            <Upload
              size={48}
              className={`${
                theme === 'light' ? 'text-blue-600' : 'text-white'
              }`}
            />
          </div>
          <p
            className={`mb-4 text-center ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}
          >
            Upload your Learning Content Here
          </p>
          <p className="text-gray-400 mb-6">Supported file types: PDF</p>
          <button
            onClick={handleUploadButtonClick}
            className={`${
              theme === 'light'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors duration-300 shadow-sm hover:shadow-md`}
          >
            Browse Files
          </button>
          <p className="mt-4 text-gray-400 text-sm">Max file size: 2MB</p>
        </div>
        {isUploading && (
          <div
            className={`mt-8 flex items-center border rounded-lg shadow-sm px-6 py-4 ${
              theme === 'light'
                ? 'bg-white border-gray-200'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <Loader size={24} className="animate-spin text-blue-600 mr-4" />
            <span
              className={`font-medium ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-200'
              }`}
            >
              Generating custom learning plan based on {uploadedFileName}...
            </span>
          </div>
        )}
      </div>
    )}
    {uploadedText && (
      <div
        className={`mx-auto p-8 border rounded-lg shadow-sm relative mt-8 max-w-4xl w-full ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}
      >
        <button
          onClick={handleClearLearningPlan}
          className={`absolute top-4 right-4 ${
            theme === 'light'
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-red-700 text-red-300 hover:bg-red-600'
          } p-2 rounded-full transition-colors duration-300`}
        >
          <Trash2 size={20} />
        </button>
        <div
          className={`prose lg:prose-lg w-full mt-4 ${
            theme === 'dark' ? 'prose-dark' : ''
          }`}
          dir="rtl"
        >
          <ReactMarkdown
            children={uploadedText}
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={theme === 'light' ? materialLight : vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className={`${
                      theme === 'light'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-700 text-gray-200'
                    } rounded px-1`}

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
  theme,
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
        credentials: 'include', // Added credentials
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
    </div>
  );
};

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
  const [isSpeaking, setIsSpeaking] = useState(false); // State for speech synthesis
  const audioRef = useRef(null); // Ref to store the Audio object

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
        credentials: 'include', // Added credentials
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
            credentials: 'include', // Added credentials
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

const ConfigPage = ({ config, setConfig, theme }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }));
  };

  return (
    <div
      className={`max-w-3xl mx-auto rounded-lg shadow-md p-8 mt-6 ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}
    >
      <h2
        className={`text-3xl font-semibold mb-8 ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}
      >
        Personalize Your Teacher
      </h2>
      <div className="space-y-8">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
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
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Teaching Style
          </label>
          <select
            name="teaching_style"
            value={config.teaching_style}
            onChange={handleChange}
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-800'
                : 'bg-gray-700 border-gray-600 text-gray-200'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
          >
            <option>Neutral</option>
            <option>Enthusiastic</option>
            <option>Socratic</option>
            <option>Strict</option>
          </select>
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Occupation
          </label>
          <input
            type="text"
            name="occupation"
            value={config.occupation}
            onChange={handleChange}
            placeholder="e.g., Student, Engineer, Teacher"
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-800'
                : 'bg-gray-700 border-gray-600 text-gray-200'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
          />
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Learning Goal
          </label>
          <input
            type="text"
            name="learning_goal"
            value={config.learning_goal}
            onChange={handleChange}
            placeholder="e.g., Master Python, Understand Quantum Physics"
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-800'
                : 'bg-gray-700 border-gray-600 text-gray-200'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
          />
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Learning Style
          </label>
          <select
            name="learning_style"
            value={config.learning_style}
            onChange={handleChange}
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-800'
                : 'bg-gray-700 border-gray-600 text-gray-200'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
          >
            <option>Visual</option>
            <option>Auditory</option>
            <option>Reading/Writing</option>
            <option>Kinesthetic</option>
          </select>
        </div>
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Interests (comma-separated)
          </label>
          <input
            type="text"
            name="interests"
            value={config.interests}
            onChange={handleChange}
            placeholder="e.g., Technology, History, Arts"
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-800'
                : 'bg-gray-700 border-gray-600 text-gray-200'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
          />
        </div>
      </div>
    </div>
  );
};

const AddTopicPage = ({ theme }) => {
  const [topicName, setTopicName] = useState('');
  const [definition, setDefinition] = useState('');
  const [instruction, setInstruction] = useState('');
  const [examples, setExamples] = useState([{ input: '', output: '' }]);
  const [references, setReferences] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleExampleChange = (index, field, value) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };

  const handleAddExample = () => {
    setExamples([...examples, { input: '', output: '' }]);
  };

  const handleReferencesUpload = (e) => {
    setReferences([...e.target.files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate inputs
    const newErrors = {};
    if (!topicName.trim()) {
      newErrors.topicName = 'Topic Name is required';
    }
    if (!definition.trim()) {
      newErrors.definition = 'Definition is required';
    }
    if (!instruction.trim()) {
      newErrors.instruction = 'Instruction is required';
    }
    examples.forEach((example, index) => {
      if (!example.input.trim()) {
        newErrors[`example_input_${index}`] = 'Example input is required';
      }
      if (!example.output.trim()) {
        newErrors[`example_output_${index}`] = 'Example output is required';
      }
    });
    if (references.length === 0) {
      newErrors.references = 'At least one reference PDF is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      // Proceed to submit data to backend
      submitData();
    }
  };

  const submitData = async () => {
    // Create FormData to send files and data
    const formData = new FormData();
    formData.append('topic_name', topicName);
    formData.append('definition', definition);
    formData.append('instruction', instruction);
    formData.append('examples', JSON.stringify(examples));

    // Append reference files
    references.forEach((file) => {
      formData.append('references', file);
    });

    try {
      const response = await fetch('http://localhost:8000/add-topic/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Success
        setSuccessMessage(`The topic "${topicName}" has been added successfully.`);
        // Clear the form
        setTopicName('');
        setDefinition('');
        setInstruction('');
        setExamples([{ input: '', output: '' }]);
        setReferences([]);
      } else {
        // Handle error
        const data = await response.json();
        setErrors({ submit: data.error || 'An error occurred' });
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      setErrors({ submit: 'An error occurred while submitting the data' });
    }
  };

  return (
    <div
      className={`max-w-3xl mx-auto rounded-lg shadow-md p-8 mt-6 ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}
    >
      <h2
        className={`text-3xl font-semibold mb-6 ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}
      >
        Add a New Topic
      </h2>
      {successMessage && (
        <div className="bg-green-100 text-green-800 p-4 rounded mb-6">
          {successMessage}
        </div>
      )}
      {errors.submit && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-6">
          {errors.submit}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Topic Name */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Topic Name
          </label>
          <input
            type="text"
            name="topicName"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              errors.topicName
                ? 'border-red-500'
                : theme === 'light'
                ? 'border-gray-300'
                : 'border-gray-600'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
              theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
            }`}
          />
          {errors.topicName && (
            <p className="text-red-500 text-sm mt-1">{errors.topicName}</p>
          )}
        </div>
        {/* Definition */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Definition
          </label>
          <textarea
            name="definition"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              errors.definition
                ? 'border-red-500'
                : theme === 'light'
                ? 'border-gray-300'
                : 'border-gray-600'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
              theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
            }`}
          ></textarea>
          {errors.definition && (
            <p className="text-red-500 text-sm mt-1">{errors.definition}</p>
          )}
        </div>
        {/* Instruction */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Instruction
          </label>
          <textarea
            name="instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              errors.instruction
                ? 'border-red-500'
                : theme === 'light'
                ? 'border-gray-300'
                : 'border-gray-600'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
              theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
            }`}
          ></textarea>
          {errors.instruction && (
            <p className="text-red-500 text-sm mt-1">{errors.instruction}</p>
          )}
        </div>
        {/* Examples */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Examples
          </label>
          {examples.map((example, index) => (
            <div key={index} className="mb-4 border p-4 rounded">
              {/* Input */}
              <div className="mb-2">
                <label
                  className={`block text-sm font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-200'
                  }`}
                >
                  Input
                </label>
                <textarea
                  value={example.input}
                  onChange={(e) =>
                    handleExampleChange(index, 'input', e.target.value)
                  }
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${
                    errors[`example_input_${index}`]
                      ? 'border-red-500'
                      : theme === 'light'
                      ? 'border-gray-300'
                      : 'border-gray-600'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
                    theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
                  }`}
                ></textarea>
                {errors[`example_input_${index}`] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[`example_input_${index}`]}
                  </p>
                )}
              </div>
              {/* Output */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-200'
                  }`}
                >
                  Output
                </label>
                <textarea
                  value={example.output}
                  onChange={(e) =>
                    handleExampleChange(index, 'output', e.target.value)
                  }
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${
                    errors[`example_output_${index}`]
                      ? 'border-red-500'
                      : theme === 'light'
                      ? 'border-gray-300'
                      : 'border-gray-600'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
                    theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-100'
                  }`}
                ></textarea>
                {errors[`example_output_${index}`] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[`example_output_${index}`]}
                  </p>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddExample}
            className={`flex items-center mt-2 text-base font-medium ${
              theme === 'light'
                ? 'text-blue-600 hover:text-blue-800'
                : 'text-blue-400 hover:text-blue-600'
            } transition-colors duration-200`}
          >
            <PlusIcon className="h-7 w-7 mr-1" />
            Add new Example
          </button>
        </div>
        {/* References */}
        <div className="mb-6">
          <label
            className={`block text-lg font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            References (PDF files)
          </label>
          {/* Custom file input */}
          <label
            className={`mt-1 inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium cursor-pointer ${
              theme === 'light'
                ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                : 'text-gray-200 bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
          >
            <UploadIcon className="h-5 w-5 mr-2" />
            Browse Files
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleReferencesUpload}
              className="hidden"
            />
          </label>
          {references.length > 0 && (
            <div className="mt-2">
              <p
                className={`text-sm ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-200'
                }`}
              >
                {references.length} file(s) selected
              </p>
            </div>
          )}
          {errors.references && (
            <p className="text-red-500 text-sm mt-1">{errors.references}</p>
          )}
        </div>
        {/* Submit Button */}
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-500 transition-colors duration-200"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

const AboutPage = ({ theme }) => {
  return (
    <div
      className={`max-w-3xl mx-auto rounded-lg shadow-md p-8 mt-6 ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}
    >
      <h2
        className={`text-3xl font-semibold mb-6 ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}
      >
        About ALLaM-Powered Teacher
      </h2>
      <p
        className={`mb-6 leading-relaxed ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-200'
        }`}
      >
        ALLaM-Powered Teacher is an innovative platform designed to revolutionize
        the way we learn. By harnessing the power of artificial intelligence, we
        provide personalized, adaptive learning experiences tailored to each
        student's unique needs and learning style.
      </p>
      <p
        className={`mb-6 leading-relaxed ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-200'
        }`}
      >
        Our mission is to make high-quality education accessible to everyone,
        anywhere, at any time. We believe that with the right tools and support,
        every learner can achieve their full potential.
      </p>
      <h3
        className={`text-2xl font-semibold mb-4 ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}
      >
        Key Features:
      </h3>
      <ul
        className={`list-disc pl-6 mb-6 space-y-2 ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-200'
        }`}
      >
        <li>Personalized learning paths</li>
        <li>Real-time feedback and assessment</li>
        <li>Adaptive difficulty levels</li>
        <li>24/7 availability</li>
        <li>Multi-subject expertise</li>
      </ul>
      <p
        className={`leading-relaxed ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-200'
        }`}
      >
        Join us on this exciting journey to transform education and empower
        learners worldwide!
      </p>
    </div>
  );
};

export default App;
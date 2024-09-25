import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, useLocation } from 'react-router-dom';
import { Send, BookOpen, Sliders, Info, Upload, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';  // Import remark-gfm
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
    { text: "Hello! How can I assist you?", sender: 'ai' },
  ]);

  const sendSimplifyRequest = async (selectedText, instruction) => {
    const userMessage = `Simplify the following text: "${selectedText}"\nInstruction: ${instruction}`;
    const updatedMessages = [...helpChatMessages, { text: userMessage, sender: 'user' }];
    setHelpChatMessages(updatedMessages);

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
          user_info: {
            explanation_complexity: config.explanation_complexity,
            teaching_style: config.teaching_style,
            occupation: config.occupation,
            learning_goal: config.learning_goal,
            learning_style: config.learning_style,
            interests: config.interests,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      setHelpChatMessages((prevMessages) => [...prevMessages, { text: '', sender: 'ai' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiResponse += chunk;
        setHelpChatMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].text = aiResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error in simplify request:', error);
      setHelpChatMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "I'm sorry, I encountered an error while processing your request.",
          sender: 'ai',
        },
      ]);
    }
  };

  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-900 text-gray-200 overflow-hidden">
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
                  <span className="text-sm font-medium text-gray-400 mr-2">presents</span>
                  <span className="text-xl font-bold text-white">ALLaM-Powered Teacher</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-baseline space-x-4">
                  <NavButton to="/" icon={<BookOpen size={18} />} label="Learn" />
                  <NavButton to="/config" icon={<Sliders size={18} />} label="Configure" />
                  <NavButton to="/about" icon={<Info size={18} />} label="About" />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow container mx-auto mt-8 p-4 overflow-hidden">
          <Switch>
            <Route exact path="/">
              <UploadPage config={config} sendSimplifyRequest={sendSimplifyRequest} />
            </Route>
            <Route path="/config">
              <ConfigPage config={config} setConfig={setConfig} />
            </Route>
            <Route path="/about" component={AboutPage} />
          </Switch>
        </main>
        <HelpChat
          messages={helpChatMessages}
          setMessages={setHelpChatMessages}
          config={config}
        />
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

const UploadPage = ({ config, sendSimplifyRequest }) => {
  const [uploadedText, setUploadedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSimplifyPopup, setShowSimplifyPopup] = useState(false);
  const [simplifyInstruction, setSimplifyInstruction] = useState('');
  const [simplifyPosition, setSimplifyPosition] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);

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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textResponse = '';

        setUploadedText(''); // Reset uploadedText

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          textResponse += chunk;
          setUploadedText((prevText) => prevText + chunk);
        }
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

  // Function to handle text selection
  const handleMouseUp = (event) => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(selectedText);
      setSimplifyPosition({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY,
      });
      setShowSimplifyPopup(true);
    } else {
      setShowSimplifyPopup(false);
    }
  };

  const handleSimplifySubmit = async () => {
    if (selectedText && simplifyInstruction) {
      sendSimplifyRequest(selectedText, simplifyInstruction);
      setShowSimplifyPopup(false);
      setSimplifyInstruction('');
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full"
      onMouseUp={handleMouseUp}
    >
      {!uploadedText && (
        <>
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
            Upload a PDF document to create a customized learning plan tailored just for you.
          </p>
        </>
      )}
      {uploadedText && (
        <div className="max-w-3xl mx-auto mt-8 p-4 bg-gray-800 text-gray-200 rounded">
          <ReactMarkdown
            children={uploadedText}
            remarkPlugins={[remarkGfm]}
            components={{
              // custom components if needed
            }}
          />
        </div>
      )}
      {showSimplifyPopup && (
        <div
          className="absolute bg-gray-800 text-gray-200 p-4 rounded shadow-lg z-10"
          style={{ top: simplifyPosition.y - 100, left: simplifyPosition.x - 150 }}
        >
          <textarea
            value={simplifyInstruction}
            onChange={(e) => setSimplifyInstruction(e.target.value)}
            placeholder="Enter instruction..."
            className="w-64 h-20 bg-gray-700 text-gray-200 border border-gray-600 p-2 rounded mb-2"
          ></textarea>
          <button
            onClick={handleSimplifySubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          >
            Simplify
          </button>
        </div>
      )}
    </div>
  );
};

const HelpChat = ({ messages, setMessages, config }) => {
  const [isOpen, setIsOpen] = useState(false);
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
          user_info: {
            explanation_complexity: config.explanation_complexity,
            teaching_style: config.teaching_style,
            occupation: config.occupation,
            learning_goal: config.learning_goal,
            learning_style: config.learning_style,
            interests: config.interests,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      setMessages((prevMessages) => [...prevMessages, { text: '', sender: 'ai' }]);

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

  return (
    <>
      <div className="fixed bottom-16 right-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-500 transition-colors duration-200 focus:outline-none"
        >
          {/* Replace with your icon */}
          <Send size={24} />
        </button>
      </div>
      <div
        className={`fixed bottom-20 right-8 w-96 h-[500px] bg-gray-800 rounded-lg shadow-lg flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
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
                {message.sender === 'user' ? (
                  message.text
                ) : (
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
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-2">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="w-full bg-gray-700 text-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
            disabled={isGenerating}
            rows={1}
            style={{ maxHeight: `${maxHeight}px` }}
          ></textarea>
        </div>
      </div>
    </>
  );
};

const ConfigPage = ({ config, setConfig }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6 text-gray-200">Personalize Your Teacher</h2>
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Teaching Style</label>
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Occupation</label>
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Learning Goal</label>
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Learning Style</label>
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
      <h2 className="text-2xl font-semibold mb-4 text-gray-200">About AI-Powered Teacher</h2>
      <p className="mb-4 text-gray-300">
        AI-Powered Teacher is an innovative platform designed to revolutionize the way we learn. By
        harnessing the power of artificial intelligence, we provide personalized, adaptive learning
        experiences tailored to each student's unique needs and learning style.
      </p>
      <p className="mb-6 text-gray-300">
        Our mission is to make high-quality education accessible to everyone, anywhere, at any time.
        We believe that with the right tools and support, every learner can achieve their full
        potential.
      </p>
      <h3 className="text-xl font-semibold mb-2 text-gray-200">Key Features:</h3>
      <ul className="list-disc pl-5 mb-6 text-gray-300 space-y-1">
        <li>Personalized learning paths</li>
        <li>Real-time feedback and assessment</li>
        <li>Adaptive difficulty levels</li>
        <li>24/7 availability</li>
        <li>Multi-subject expertise</li>
      </ul>
      <p className="text-gray-300">
        Join us on this exciting journey to transform education and empower learners worldwide!
      </p>
    </div>
  );
};

export default App;

import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, useLocation } from 'react-router-dom';
import { Send, BookOpen, Sliders, Info, Trash2 } from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [
      { text: "Hello! I'm your AI teacher. How can I assist you today?", sender: 'ai' },
    ];
  });

  const [config, setConfig] = useState({
    explanation_complexity: 50,
    teaching_style: 'Neutral',
    occupation: '',
    learning_goal: '',
    learning_style: 'Visual',
    interests: '',
  });

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
    setMessages([{ text: "Hello! I'm your AI teacher. How can I assist you today?", sender: 'ai' }]);
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
              <TeacherInterface messages={messages} setMessages={setMessages} clearHistory={clearHistory} config={config} />
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
        active ? 'text-blue-400 bg-gray-700' : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'
      } transition-colors duration-200`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Link>
  );
};

const TeacherInterface = ({ messages, setMessages, clearHistory, config }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const sendMessageToBackend = async (userMessage) => {
    setIsGenerating(true);
    const updatedMessages = [...messages, { text: userMessage, sender: 'user' }];
    setMessages(updatedMessages);

    try {
      const response = await fetch('http://localhost:8000/streamer/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_history: updatedMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          user_info: {
            explanation_complexity: config.explanation_complexity,
            teaching_style: config.teaching_style,
            occupation: config.occupation,
            learning_goal: config.learning_goal,
            learning_style: config.learning_style,
            interests: config.interests,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      setMessages(prevMessages => [...prevMessages, { text: '', sender: 'ai' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiResponse += chunk;
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].text = aiResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message to backend:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { text: "I'm sorry, I encountered an error while processing your request.", sender: 'ai' }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    setInputMessage('');
    await sendMessageToBackend(inputMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl md:max-w-4xl xl:max-w-5xl flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-200">Chat with AI Teacher</h2>
          <button
            onClick={clearHistory}
            className="bg-gray-700 text-gray-300 p-2 rounded-md hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 flex items-center"
          >
            <Trash2 size={20} className="mr-2" />
            Clear History
          </button>
        </div>
        <div className="flex-grow overflow-y-auto space-y-2 pb-4 pr-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[70%] sm:max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user' ? 'bg-blue-800 text-blue-100' : 'bg-gray-700 text-gray-200'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-4 flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-grow bg-gray-700 text-gray-200 rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isGenerating}
          />
          <button
            onClick={handleSendMessage}
            className={`bg-blue-700 text-white p-2 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
            disabled={isGenerating}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfigPage = ({ config, setConfig }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({ ...prevConfig, [name]: value }));
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
      <h2 className="text-2xl font-semibold mb-4 text-gray-200">About AI-Powered Teacher</h2>
      <p className="mb-4 text-gray-300">
        AI-Powered Teacher is an innovative platform designed to revolutionize the way we learn. By harnessing the power of artificial intelligence, we provide personalized, adaptive learning experiences tailored to each student's unique needs and learning style.
      </p>
      <p className="mb-6 text-gray-300">
        Our mission is to make high-quality education accessible to everyone, anywhere, at any time. We believe that with the right tools and support, every learner can achieve their full potential.
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

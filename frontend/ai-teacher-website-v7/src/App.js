// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import NavButton from './components/NavButton';
import MainPage from './components/MainPage';
import ConfigPage from './components/ConfigPage';
import AddTopicPage from './components/AddTopicPage';
import AboutPage from './components/AboutPage';

const App = () => {
  const [config, setConfig] = useState({
    explanation_complexity: 50,
    teaching_style: 'Neutral',
    occupation: '',
    learning_goal: '',
    learning_style: 'Visual',
    interests: '',
  });

  const [theme, setTheme] = useState('light');

  // Move state variables from MainPage up to App.js
  const [helpChatMessages, setHelpChatMessages] = useState([
    { text: 'Ask me anything about your learning plan!', sender: 'ai' },
  ]);
  const [simplifierMessages, setSimplifierMessages] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [uploadedText, setUploadedText] = useState('');
  const [simplifiedText, setSimplifiedText] = useState('');
  const [isHelperVisible, setIsHelperVisible] = useState(true);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div
        className={`flex flex-col min-h-screen ${
          theme === 'light' ? 'bg-white text-gray-800' : 'bg-gray-900 text-gray-100'
        }`}
      >
        {/* Navigation Bar */}
        <nav className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-md`}>
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Title */}
              <div className="flex items-center">
                <NavButton to="/" label="ALLaM-Powered Teacher" theme={theme} isLogo />
              </div>
              {/* Navigation Links */}
              <div className="hidden sm:flex items-center space-x-6">
                <NavButton to="/" icon="BookOpen" label="Learn" theme={theme} />
                <NavButton to="/config" icon="Sliders" label="Configure" theme={theme} />
                <NavButton to="/add-topic" icon="Plus" label="Add Topic" theme={theme} />
                <NavButton to="/about" icon="Info" label="About Us" theme={theme} />
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

        {/* Main Content */}
        <main className="flex-grow p-6 overflow-hidden">
          <Switch>
            <Route exact path="/">
              <MainPage
                config={config}
                setConfig={setConfig}
                theme={theme}
                helpChatMessages={helpChatMessages}
                setHelpChatMessages={setHelpChatMessages}
                simplifierMessages={simplifierMessages}
                setSimplifierMessages={setSimplifierMessages}
                selectedText={selectedText}
                setSelectedText={setSelectedText}
                uploadedText={uploadedText}
                setUploadedText={setUploadedText}
                simplifiedText={simplifiedText}
                setSimplifiedText={setSimplifiedText}
                isHelperVisible={isHelperVisible}
                setIsHelperVisible={setIsHelperVisible}
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

        {/* Footer */}
        <footer
          className={`${
            theme === 'light' ? 'bg-white text-gray-500' : 'bg-gray-800 text-gray-400'
          } text-center py-4 text-sm`}
        >
          <p>&copy; 2024 ALLaM-Powered Teacher by MozaicAI Solutions.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;

// components/ConfigPage.js
import React from 'react';

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
        {/* Hidden Explanation Complexity Slider */}
        <div className="hidden">
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
        </div>

        {/* Teaching Style */}
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

        {/* Explanation Complexity (Modified from Occupation) */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Explanation Complexity
          </label>
          <select
            name="explanation_complexity"
            value={config.explanation_complexity}
            onChange={handleChange}
            className={`mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-800'
                : 'bg-gray-700 border-gray-600 text-gray-200'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
          >
            <option>Primary School (Ages 5-11)</option>
            <option>Middle School (Ages 11-14)</option>
            <option>High School (Ages 14-18)</option>
            <option>Undergraduate (Masters, Early Phd)</option>
            <option>Expert</option>
          </select>
        </div>

        {/* Hidden Learning Goal */}
        <div className="hidden">
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
        </div>

        {/* Hidden Learning Style */}
        <div className="hidden">
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
        </div>

        {/* Interests */}
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

export default ConfigPage;

// components/AddTopicPage.js
import React, { useState } from 'react';
import {
  PlusIcon,
  UploadIcon,
  QuestionMarkCircleIcon,
  XCircleIcon,
} from '@heroicons/react/solid';

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
    if (examples.length === 0) {
      newErrors.examples = 'At least one example is required';
    } else {
      examples.forEach((example, index) => {
        if (!example.input.trim()) {
          newErrors[`example_input_${index}`] = 'Example input is required';
        }
        if (!example.output.trim()) {
          newErrors[`example_output_${index}`] = 'Example output is required';
        }
      });
    }
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

  const tooltipText = {
    topicName: 'Enter a name for the topic.',
    definition: 'Provide a clear and concise definition of the topic.',
    instruction: 'Specify instructions or guidelines that the ALLaM teacher should adhere to.',
    examples: 'Add examples to illustrate how the ALLaM teacher should respond to specific inputs.',
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
            className={`block text-sm font-medium mb-2 flex items-center ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Topic Name
            <div className="relative ml-1 inline-block">
              <div className="group relative inline-block">
                <QuestionMarkCircleIcon
                  className={`h-5 w-5 ${
                    theme === 'light' ? 'text-gray-400' : 'text-gray-300'
                  }`}
                />
                <div
                  className={`absolute left-6 bottom-0 transform translate-y-full w-60 p-2 rounded-md shadow-lg text-sm z-50 ${
                    theme === 'light'
                      ? 'bg-white text-gray-700'
                      : 'bg-gray-700 text-gray-200'
                  } opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
                >
                  {tooltipText.topicName}
                </div>
              </div>
            </div>
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
              theme === 'light'
                ? 'bg-white text-gray-900'
                : 'bg-gray-700 text-gray-100'
            }`}
          />
          {errors.topicName && (
            <p className="text-red-500 text-sm mt-1">{errors.topicName}</p>
          )}
        </div>
        {/* Definition */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 flex items-center ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Definition
            <div className="relative ml-1 inline-block">
              <div className="group relative inline-block">
                <QuestionMarkCircleIcon
                  className={`h-5 w-5 ${
                    theme === 'light' ? 'text-gray-400' : 'text-gray-300'
                  }`}
                />
                <div
                  className={`absolute left-6 bottom-0 transform translate-y-full w-60 p-2 rounded-md shadow-lg text-sm z-50 ${
                    theme === 'light'
                      ? 'bg-white text-gray-700'
                      : 'bg-gray-700 text-gray-200'
                  } opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
                >
                  {tooltipText.definition}
                </div>
              </div>
            </div>
          </label>
          <textarea
            name="definition"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            className={`h-32 mt-1 block w-full pl-3 pr-10 py-3 text-base border ${
              errors.definition
                ? 'border-red-500'
                : theme === 'light'
                ? 'border-gray-300'
                : 'border-gray-600'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
              theme === 'light'
                ? 'bg-white text-gray-900'
                : 'bg-gray-700 text-gray-100'
            }`}
          ></textarea>
          {errors.definition && (
            <p className="text-red-500 text-sm mt-1">{errors.definition}</p>
          )}
        </div>
        {/* Instruction */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 flex items-center ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Instruction
            <div className="relative ml-1 inline-block">
              <div className="group relative inline-block">
                <QuestionMarkCircleIcon
                  className={`h-5 w-5 ${
                    theme === 'light' ? 'text-gray-400' : 'text-gray-300'
                  }`}
                />
                <div
                  className={`absolute left-6 bottom-0 transform translate-y-full w-60 p-2 rounded-md shadow-lg text-sm z-50 ${
                    theme === 'light'
                      ? 'bg-white text-gray-700'
                      : 'bg-gray-700 text-gray-200'
                  } opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
                >
                  {tooltipText.instruction}
                </div>
              </div>
            </div>
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
              theme === 'light'
                ? 'bg-white text-gray-900'
                : 'bg-gray-700 text-gray-100'
            }`}
          ></textarea>
          {errors.instruction && (
            <p className="text-red-500 text-sm mt-1">{errors.instruction}</p>
          )}
        </div>
        {/* Examples */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 flex items-center ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-200'
            }`}
          >
            Examples
            <div className="relative ml-1 inline-block">
              <div className="group relative inline-block">
                <QuestionMarkCircleIcon
                  className={`h-5 w-5 ${
                    theme === 'light' ? 'text-gray-400' : 'text-gray-300'
                  }`}
                />
                <div
                  className={`absolute left-6 bottom-0 transform translate-y-full w-60 p-2 rounded-md shadow-lg text-sm z-50 ${
                    theme === 'light'
                      ? 'bg-white text-gray-700'
                      : 'bg-gray-700 text-gray-200'
                  } opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
                >
                  {tooltipText.examples}
                </div>
              </div>
            </div>
          </label>
          {examples.map((example, index) => (
            <div key={index} className="mb-4 border p-4 rounded relative">
              {/* Remove Example Button */}
              {examples.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newExamples = [...examples];
                    newExamples.splice(index, 1);
                    setExamples(newExamples);
                  }}
                  className={`absolute top-2 right-2 ${
                    theme === 'light'
                      ? 'text-red-500 hover:text-red-700'
                      : 'text-red-400 hover:text-red-600'
                  }`}
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              )}
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
                    theme === 'light'
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-700 text-gray-100'
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
                    theme === 'light'
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-700 text-gray-100'
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
          <div className="flex items-center mt-2">
            <button
              type="button"
              onClick={handleAddExample}
              className={`flex items-center text-base font-medium ${
                theme === 'light'
                  ? 'text-blue-600 hover:text-blue-800'
                  : 'text-blue-400 hover:text-blue-600'
              } transition-colors duration-200`}
            >
              <PlusIcon className="h-7 w-7 mr-1" />
              Add new Example
            </button>
          </div>
          {errors.examples && (
            <p className="text-red-500 text-sm mt-1">{errors.examples}</p>
          )}
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

export default AddTopicPage;

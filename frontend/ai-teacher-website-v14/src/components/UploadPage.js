// components/UploadPage.js
import React, { useState, useRef } from 'react';
import { Upload, Trash2, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  materialLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useHistory } from 'react-router-dom'; // Import useHistory

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

  // State variable to store userId
  const [userId, setUserId] = useState('');

  // Modify handleFile function in UploadPage.js
  const handleFile = async (file) => {
    if (file) {
      setIsUploading(true);
      setUploadedFileName(file.name);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/upload-pdf/', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the classified_topic from response headers
        const classifiedTopicHeader = response.headers.get('X-Classified-Topic');
        if (classifiedTopicHeader) {
          setClassifiedTopic(classifiedTopicHeader);
          setSelectedTopic(classifiedTopicHeader);
        }

        // Get the userId from response headers
        const userIdHeader = response.headers.get('X-User-ID');
        if (userIdHeader) {
          setUserId(userIdHeader);
        }

        // **Fetch topics from backend**
        await fetchTopics();
        // Show the topic confirmation modal
        setShowTopicConfirmation(true);

        // Read the response body as a stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let receivedText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          receivedText += chunk;
          setUploadedText(receivedText); // Update state to display streamed content
        }
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
    const selectedTextValue = selection.toString();
    if (selectedTextValue) {
      setSelectedText(selectedTextValue);
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
        return { backgroundColor: 'rgb(50, 61, 77)', borderColor: '#7F9CF5' };
      } else {
        return {}; // Light mode styles are handled via Tailwind classes
      }
    }
    return {};
  };

  const history = useHistory(); // Initialize history

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
              className={`text-2xl mb-6 ${
                theme === 'light' ? 'text-gray-800' : 'text-gray-100'
              }`}
            >
              {classifiedTopic !== 'General_Paraphrasing' ? (
                <>
                  ALLAM has identified the topic{' '}
                  <span className="font-bold">
                    {classifiedTopic.replace(/_/g, ' ')}
                  </span>{' '}
                  for the PDF you uploaded. Please review the topic and adjust it
                  if necessary!
                </>
              ) : (
                <>
                  ALLAM couldn’t match your PDF with a specific topic. The
                  default topic{' '}
                  <span className="font-bold">
                    {classifiedTopic.replace(/_/g, ' ')}
                  </span>{' '}
                  has been selected.
                  <br />
                  <br />
                  If your PDF fits one of the topics below, please select it, or
                  request your teacher to add materials for this new topic!
                </>
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

      {/* Upload Area */}
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

      {/* Display Uploaded Content */}
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
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ node, ...props }) => {
                  const imageSrc = `http://localhost:8000/static/user_images/${userId}/${props.src}`;
                  return <img {...props} src={imageSrc} />;
                },
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
                blockquote: ({ node, children, ...props }) => (
                  <blockquote
                    className={`border-l-4 pl-4 italic my-4 ${
                      theme === 'light'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-blue-700 border-blue-500 text-white'
                    }`}
                  >
                    {children}
                  </blockquote>
                ),
                table: ({ node, children, ...props }) => (
                  <table
                    className={`min-w-full border-collapse ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}
                    {...props}
                  >
                    {children}
                  </table>
                ),
                thead: ({ node, children, ...props }) => (
                  <thead
                    className={`${
                      theme === 'light' ? 'bg-blue-100' : 'bg-blue-700'
                    }`}
                    {...props}
                  >
                    {children}
                  </thead>
                ),
                tbody: ({ node, children, ...props }) => (
                  <tbody {...props}>{children}</tbody>
                ),
                tr: ({ node, children, ...props }) => (
                  <tr
                    className={`${
                      theme === 'light'
                        ? 'hover:bg-blue-50'
                        : 'hover:bg-blue-600'
                    }`}
                    style={{ cursor: 'default' }}
                    {...props}
                  >
                    {children}
                  </tr>
                ),
                th: ({ node, children, ...props }) => (
                  <th
                    className={`px-4 py-2 border ${
                      theme === 'light'
                        ? 'border-blue-200 text-gray-800'
                        : 'border-blue-700 text-white'
                    } text-left font-semibold`}
                    {...props}
                  >
                    {children}
                  </th>
                ),
                td: ({ node, children, ...props }) => (
                  <td
                    className={`px-4 py-2 border ${
                      theme === 'light'
                        ? 'border-blue-200 text-gray-800'
                        : 'border-blue-700 text-gray-200'
                    }`}
                    {...props}
                  >
                    {children}
                  </td>
                ),
                h1: ({ node, children, ...props }) => (
                  <h1
                    className={`text-3xl font-bold mt-8 mb-4 ${
                      theme === 'light' ? 'text-gray-800' : 'text-gray-100'
                    }`}
                    {...props}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ node, children, ...props }) => (
                  <h2
                    className={`text-2xl font-bold mt-6 mb-4 ${
                      theme === 'light' ? 'text-gray-800' : 'text-gray-100'
                    }`}
                    {...props}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ node, children, ...props }) => (
                  <h3
                    className={`text-xl font-semibold mt-4 mb-2 ${
                      theme === 'light' ? 'text-gray-800' : 'text-gray-100'
                    }`}
                    {...props}
                  >
                    {children}
                  </h3>
                ),
                // Other custom components can be added here
              }}
            >
              {uploadedText}
            </ReactMarkdown>
          </div>
          {/* Add the "Multiple-choice quiz" button here */}
          <div className="mt-8 flex justify-between">
             <button
             onClick={() => history.push('/free-text-quiz')}
             className={`bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-300 font-semibold`}
             >
             Free-Text Quiz
             </button>

            <button
            onClick={() => history.push('/quiz')}
            className={`bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold`}
            >
            Multiple-choice Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
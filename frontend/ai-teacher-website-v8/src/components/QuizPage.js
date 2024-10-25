// components/QuizPage.js
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

const QuizPage = ({ theme }) => {
  const [quizData, setQuizData] = useState([]);
  const history = useHistory();
  const [userAnswers, setUserAnswers] = useState([]); // To store user's selected answers
  const [quizSubmitted, setQuizSubmitted] = useState(false); // To track if the quiz is submitted

  useEffect(() => {
    // Fetch the quiz data
    const fetchQuiz = async () => {
      try {
        const response = await fetch('http://localhost:8000/quiz/', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // data.quiz is an array of quiz questions
        const parsedQuizData = data.quiz.map((quizString) =>
          parseQuizString(quizString)
        );
        setQuizData(parsedQuizData);
        // Initialize userAnswers with empty arrays for each question
        setUserAnswers(parsedQuizData.map(() => []));
      } catch (error) {
        console.error('Error fetching quiz:', error);
      }
    };

    fetchQuiz();
  }, []);

  // Function to parse the quiz string
  const parseQuizString = (quizString) => {
  // Split the quiz string into lines and remove empty lines
  let lines = quizString.split('\n').filter((line) => line.trim() !== '');

  // Initialize variables
  let questionText = '';
  let options = [];
  let parsingOptions = false;
  let correctAnswersText = '';
  let inCorrectAnswersSection = false;

  // Process the lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if the line indicates the start of correct answers
    if (/^.*الإجابة\s*الصحيحة/.test(line)) {
      // Start collecting correct answers
      inCorrectAnswersSection = true;

      // Extract the correct answers text starting from this line
      correctAnswersText = lines.slice(i).join('\n').trim();
      break; // Stop processing further lines
    }

    if (!inCorrectAnswersSection) {
      // Check if the line starts with an option label (letter or number)
      if (/^([A-Za-zأ-ي0-9٠-٩]+)[\)\.]\s*(.*)/.test(line)) {
        parsingOptions = true;
        const labelMatch = line.match(/^([A-Za-zأ-ي0-9٠-٩]+)[\)\.]\s*(.*)/);
        if (labelMatch) {
          options.push({ label: labelMatch[1], text: labelMatch[2] });
        }
      }
      // If already parsing options but the line doesn't start with a label
      else if (parsingOptions) {
        // Append this line to the last option's text
        if (options.length > 0) {
          options[options.length - 1].text += ' ' + line;
        }
      }
      // Otherwise, it's part of the question text
      else {
        questionText += (questionText ? '\n' : '') + line;
      }
    }
  }

  // Extract correct option labels from correctAnswersText
  let correctOptionLabels = extractCorrectOptionLabels(correctAnswersText);

  // Return the parsed question
  return {
    questionText,
    options,
    correctAnswersText,
    correctOptionLabels,
  };
};


  // Function to extract correct option labels from correctAnswersText
      const extractCorrectOptionLabels = (correctAnswersText) => {
  // Remove any prefix like 'الإجابة الصحيحة:', 'الإجابة الصحيحة هي:', etc.
  let correctText = correctAnswersText.replace(/.*الإجابة\s*الصحيحة[:：]?\s*هي?[:：]?\s*/, '').trim();

  // Split the correctText using common separators: spaces, commas, Arabic commas, periods, 'و' (and in Arabic)
  let tokens = correctText.split(/[\s,،\.]+|[\s]*و[\s]*/);

  // Now, for each token, if it matches a single letter (A-Z, a-z, or Arabic letters) or a digit (Western or Arabic numerals), possibly followed by ')' or '.', collect it
  let labels = tokens.map(token => {
    let match = token.match(/^([A-Za-zأ-ي0-9٠-٩])[\)\.]?$/);
    return match ? match[1] : null;
  }).filter(label => label !== null);

  // Remove duplicates
  labels = [...new Set(labels)];

  return labels;
};


  // Handle user's selection of options
  const handleOptionChange = (e, questionIndex, optionLabel) => {
    const isChecked = e.target.checked;
    setUserAnswers((prevUserAnswers) => {
      const newUserAnswers = [...prevUserAnswers];
      if (isChecked) {
        // Add the option label to the user's answers for this question
        newUserAnswers[questionIndex] = [...newUserAnswers[questionIndex], optionLabel];
      } else {
        // Remove the option label from the user's answers for this question
        newUserAnswers[questionIndex] = newUserAnswers[questionIndex].filter(
          (label) => label !== optionLabel
        );
      }
      return newUserAnswers;
    });
  };

  // Handle quiz submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setQuizSubmitted(true);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${
        theme === 'light'
          ? 'bg-white text-gray-800'
          : 'bg-gray-900 text-gray-100'
      } min-h-screen`}
      dir="rtl"
    >
      <h1 className="text-3xl font-bold mb-8">Quiz</h1>
      {quizData.length === 0 ? (
        <p>Loading quiz...</p>
      ) : (
        <form className="w-full max-w-2xl" onSubmit={handleSubmit}>
          {quizData.map((question, index) => (
            <div
              key={index}
              className={`mb-8 p-4 border rounded-lg ${
                theme === 'light'
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <p className="mb-4 font-semibold text-right">{question.questionText}</p>
              <div className="space-y-2">
                {question.options.map((option, idx) => {
                  // Check if this option is selected
                  const isSelected = userAnswers[index].includes(option.label);
                  // Determine the class based on correctness after submission
                  let optionClass = '';
                  if (quizSubmitted) {
                    const isCorrect = question.correctOptionLabels.includes(option.label);
                    if (isCorrect && isSelected) {
                      // Correctly selected option
                      optionClass = theme === 'light' ? 'bg-green-200' : 'bg-green-700';
                    } else if (!isCorrect && isSelected) {
                      // Incorrectly selected option
                      optionClass = theme === 'light' ? 'bg-red-200' : 'bg-red-700';
                    } else if (isCorrect && !isSelected) {
                      // Missed correct option
                      optionClass = theme === 'light' ? 'bg-yellow-200' : 'bg-yellow-700';
                    }
                  }
                  return (
                    <label
                      key={idx}
                      className={`flex items-center space-x-2 space-x-reverse p-2 rounded ${optionClass}`}
                    >
                      <input
                        type="checkbox"
                        name={`question-${index}`}
                        value={option.label}
                        checked={isSelected}
                        onChange={(e) => handleOptionChange(e, index, option.label)}
                        disabled={quizSubmitted}
                        className="form-checkbox h-5 w-5"
                      />
                      <span>{`${option.label}) ${option.text}`}</span>
                    </label>
                  );
                })}
              </div>
              {/* Show correct answer after each question only when quiz is submitted */}
              {quizSubmitted && (
                 <p className="mt-4 text-green-600 font-medium text-right">
                    {question.correctAnswersText}
                 </p>
              )}
            </div>
          ))}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => history.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
            >
              Return to Learning Plan
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-300"
              disabled={quizSubmitted}
            >
              Submit the Quiz
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default QuizPage;

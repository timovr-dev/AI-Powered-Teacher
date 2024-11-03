// components/FreeTextQuizPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import Spinner from './Spinner';

const FreeTextQuizPage = ({ theme }) => {
  const [quizData, setQuizData] = useState([]);
  const history = useHistory();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadingEvaluations, setLoadingEvaluations] = useState({});
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [recordingStates, setRecordingStates] = useState({});
  const mediaRecorderRefs = useRef({});
  const audioChunksRefs = useRef({});
  const canceledRefs = useRef({}); // Added to track cancellations
  const isRecording = useRef({}); // Added to track recording state

  useEffect(() => {
    // Fetch the free-text quiz data
    const fetchQuiz = async () => {
      try {
        const response = await fetch('http://localhost:8000/free-text-quiz/', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.quiz && data.quiz.length > 0) {
          const parsedQuizData = data.quiz.map((quizString) =>
            parseQuizString(quizString)
          );
          setQuizData(parsedQuizData);
        } else {
          console.error('No quiz data found.');
          setQuizData([]);
        }
      } catch (error) {
        console.error('Error fetching free-text quiz:', error);
      }
    };

    fetchQuiz();
  }, []);

  // Function to parse the quiz string
  const parseQuizString = (quizString) => {
    const [questionText, answerText] = quizString.split('\n\nالإجابة الصحيحة:');
    return {
      questionText: questionText ? questionText.trim() : '',
      correctAnswer: answerText ? answerText.trim() : '',
      userAnswer: '',
      evaluation: null,
    };
  };

  // Handle user's answer input
  const handleAnswerChange = (e, index) => {
    const value = e.target.value;
    setQuizData((prevQuizData) => {
      const newQuizData = [...prevQuizData];
      newQuizData[index].userAnswer = value;
      return newQuizData;
    });
  };

  // Function to evaluate a single question
  const evaluateQuestion = async (questionIndex) => {
    const question = quizData[questionIndex];
    const userAnswer = question.userAnswer.trim();

    // Initialize loading state for this question
    setLoadingEvaluations((prevState) => ({
      ...prevState,
      [questionIndex]: true,
    }));

    if (!userAnswer) {
      // User did not provide an answer
      const evaluation = `التقدير: 0\n\nتفسير التقدير: لم يتم تقديم إجابة.`;
      // Update the evaluation in the state
      setQuizData((prevQuizData) => {
        const newQuizData = [...prevQuizData];
        newQuizData[questionIndex].evaluation = evaluation;
        return newQuizData;
      });
      // Remove loading state
      setLoadingEvaluations((prevState) => ({
        ...prevState,
        [questionIndex]: false,
      }));
    } else {
      // Proceed to call the evaluation endpoint
      const payload = {
        answer: userAnswer,
        ground_truth: question.correctAnswer,
      };
      try {
        const response = await fetch('http://localhost:8000/evaluate-text-quiz/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const evaluation = data.evaluation;
        // Update the evaluation in the state
        setQuizData((prevQuizData) => {
          const newQuizData = [...prevQuizData];
          newQuizData[questionIndex].evaluation = evaluation;
          return newQuizData;
        });
      } catch (error) {
        console.error('Error evaluating question:', error);
      } finally {
        // Remove loading state for this question
        setLoadingEvaluations((prevState) => ({
          ...prevState,
          [questionIndex]: false,
        }));
      }
    }
  };

  // Handle quiz submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Evaluate each question individually
    quizData.forEach((_, index) => {
      evaluateQuestion(index);
    });
  };

  // Function to parse the 'التقدير' and 'تفسير التقدير' from evaluation text
  const parseEvaluation = (evaluationText) => {
    // Use regular expressions to extract the grade and the explanation
    const gradeMatch = evaluationText.match(/التقدير\s*:\s*(\d+)/);
    const explanationMatch = evaluationText.match(/تفسير التقدير\s*:\s*([\s\S]*)/);

    const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : null;
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';

    return { grade, explanation };
  };

  // Function to determine the color based on the grade
  const getGradeColor = (grade) => {
    if (grade >= 90) {
      return 'text-green-700'; // Dark green
    } else if (grade >= 75) {
      return 'text-green-500';
    } else if (grade >= 50) {
      return 'text-yellow-500';
    } else {
      return 'text-red-600';
    }
  };

  // Microphone permission
  const requestMicrophoneAccess = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setMicrophoneEnabled(true);
        stream.getTracks().forEach((track) => track.stop()); // Stop all tracks
        alert('Microphone permission granted!'); // "Microphone permission granted" in Arabic
      })
      .catch((err) => {
        console.error('Microphone permission denied:', err);
        alert('Microphone permission denied!'); // "Microphone permission denied" in Arabic
      });
  };

  // Handle recording toggle
  const handleRecordToggle = (index) => {
  if (recordingStates[index]) {
    // Stop recording
    if (mediaRecorderRefs.current[index]) {
      console.log(`Stopping recording for index ${index}`);
      mediaRecorderRefs.current[index].stop();
    }
    setRecordingStates((prevState) => ({ ...prevState, [index]: false }));
  } else {
    // Start recording
    if (isRecording.current[index]) {
      console.warn(`Recording already in progress for index ${index}`);
      return;
    }

    // Clean up any existing media recorder
    if (mediaRecorderRefs.current[index]) {
      console.log(`Cleaning up old recorder for index ${index}`);
      mediaRecorderRefs.current[index].stop();
      mediaRecorderRefs.current[index] = null;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        console.log(`Starting new recording for index ${index}`);
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRefs.current[index] = mediaRecorder;
        audioChunksRefs.current[index] = [];
        canceledRefs.current[index] = false;
        isRecording.current[index] = true;

        mediaRecorder.start();
        setRecordingStates((prevState) => ({ ...prevState, [index]: true }));

        playRecordingTone();

        // Log when data is available
        mediaRecorder.addEventListener('dataavailable', (event) => {
          console.log(`dataavailable event fired for index ${index}`);
          audioChunksRefs.current[index].push(event.data);
        });

        // Log when recording stops
        mediaRecorder.addEventListener(
          'stop',
          () => {
            console.log(`onstop event fired for index ${index}`);
            isRecording.current[index] = false; // Recording stopped
            stream.getTracks().forEach((track) => track.stop());

            const audioBlob = new Blob(audioChunksRefs.current[index], {
              type: 'audio/webm',
            });

            if (!canceledRefs.current[index]) {
              console.log(`Calling transcribeAudio for index ${index}`);
              transcribeAudio(index, audioBlob);
            }

            // Clean up
            audioChunksRefs.current[index] = [];
            mediaRecorderRefs.current[index] = null;
            canceledRefs.current[index] = false;
          },
          { once: true }
        );
      })
      .catch((err) => {
        console.error('Error accessing microphone:', err);
      });
  }
};






  // Handle cancel recording
  const handleCancelRecording = (index) => {
    if (mediaRecorderRefs.current[index]) {
      canceledRefs.current[index] = true; // Set the canceled flag
      mediaRecorderRefs.current[index].stop();
      setRecordingStates((prevState) => ({ ...prevState, [index]: false }));
      isRecording.current[index] = false; // Recording stopped
      // Clear the audio chunks
      audioChunksRefs.current[index] = [];
    }
  };

  const playRecordingTone = () => {
    // Simple beep sound
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 note
    oscillator.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2); // Play for 0.2 seconds
  };

  // Transcribe audio
  const transcribeAudio = (index, audioBlob) => {
  console.log(`transcribeAudio called for index ${index}`);

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');

  fetch('http://localhost:8000/transcribe/', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
  const transcription = data.transcription;
  console.log(`Received transcription for index ${index}: ${transcription}`);

  // Check if userAnswer already contains the transcription
  setQuizData((prevQuizData) => {
    const newQuizData = [...prevQuizData];
    if (!newQuizData[index].userAnswer.includes(transcription)) {
      console.log(`Updating userAnswer for index ${index}`);
      newQuizData[index].userAnswer +=
        (newQuizData[index].userAnswer ? ' ' : '') + transcription;
    } else {
      console.log(`Transcription already present for index ${index}, skipping update`);
    }
    return newQuizData;
  });
})

    .catch((error) => {
      console.error('Error transcribing audio:', error);
    });
};


  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${
        theme === 'light' ? 'bg-white text-gray-800' : 'bg-gray-900 text-gray-100'
      } min-h-screen`}
    >
      <h1 className="text-3xl font-bold mb-8">Free-Text Quiz</h1>
      <button
        onClick={requestMicrophoneAccess}
        type="button"
        className="bg-blue-600 text-white px-4 py-2 rounded-md mb-4"
      >
        Enable Microphone {/* "Enable Microphone" in Arabic */}
      </button>
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
              <p className="mb-4 font-semibold text-right" dir="rtl">
                {question.questionText}
              </p>
              <textarea
                value={question.userAnswer}
                onChange={(e) => handleAnswerChange(e, index)}
                className={`w-full h-24 p-2 border rounded-md focus:outline-none focus:ring-2 ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 focus:ring-blue-500 text-gray-800'
                    : 'bg-gray-700 border-gray-600 focus:ring-blue-400 text-gray-100'
                } text-right`}
                placeholder="اكتب إجابتك هنا..."
                disabled={isSubmitted}
                dir="rtl"
              ></textarea>

              {/* Record/Stop and Cancel Buttons */}
              {!isSubmitted && (
                <div className="flex justify-start mt-2">
                  <button
                    onClick={() => handleRecordToggle(index)}
                    type="button"
                    className={`px-4 py-2 rounded-md mr-2 ${
                      recordingStates[index]
                        ? 'bg-red-600 text-white'
                        : 'bg-green-600 text-white'
                    }`}
                    disabled={!microphoneEnabled}
                  >
                    {recordingStates[index] ? 'stop recording' : 'record'}
                  </button>
                  <button
                    onClick={() => handleCancelRecording(index)}
                    type="button"
                    className="bg-gray-500 text-white px-4 py-2 rounded-md"
                    disabled={!recordingStates[index]}
                  >
                    cancel
                  </button>
                </div>
              )}

              {/* Show the correct answer and evaluation after submission */}
              {isSubmitted && (
                <>
                  <p
                    className="mt-4 text-green-600 font-medium text-right"
                    dir="rtl"
                  >
                    الإجابة الصحيحة: {question.correctAnswer}
                  </p>
                  {/* Show the evaluation or loading indicator */}
                  {question.evaluation ? (
                    <div className="mt-4 text-right" dir="rtl">
                      {(() => {
                        const { grade, explanation } = parseEvaluation(
                          question.evaluation
                        );
                        const gradeColor =
                          grade !== null ? getGradeColor(grade) : 'text-gray-800';
                        return (
                          <div>
                            <p className={`font-bold ${gradeColor}`}>
                              التقدير: {grade}
                            </p>
                            <p className="text-black">تفسير التقدير: {explanation}</p>
                          </div>
                        );
                      })()}
                    </div>
                  ) : loadingEvaluations[index] ? (
                    // Show the spinner
                    <div className="mt-4">
                      <Spinner theme={theme} />
                    </div>
                  ) : null}
                </>
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
              disabled={isSubmitted}
            >
              Submit Quiz
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FreeTextQuizPage;

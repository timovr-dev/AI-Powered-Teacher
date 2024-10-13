import React from 'react';
import { Target } from 'lucide-react';

const LearningGoals = ({ goals }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-64 mt-6">
      <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
        <Target size={24} className="mr-2 text-blue-500" />
        Learning Goals
      </h3>
      <ul className="space-y-3">
        {goals.map((goal, index) => (
          <li key={index} className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-sm font-medium mr-3">
              {index + 1}
            </span>
            <p className="text-gray-300">{goal}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LearningGoals;
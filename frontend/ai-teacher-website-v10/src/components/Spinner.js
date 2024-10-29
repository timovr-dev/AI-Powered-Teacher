// components/Spinner.js
import React from 'react';

const Spinner = ({ theme }) => (
  <div className="flex justify-center items-center">
    <div
      className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${
        theme === 'light' ? 'border-blue-500' : 'border-white'
      }`}
    ></div>
  </div>
);

export default Spinner;

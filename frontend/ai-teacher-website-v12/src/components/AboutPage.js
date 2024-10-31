// components/AboutPage.js
import React from 'react';

const AboutPage = ({ theme }) => {
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
        About ALLaM-Powered Teacher
      </h2>
      <p
        className={`mb-6 leading-relaxed ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-200'
        }`}
      >
        ALLaM-Powered Teacher is an innovative platform designed to revolutionize
        the way we learn. By harnessing the power of artificial intelligence, we
        provide personalized, adaptive learning experiences tailored to each
        student's unique needs and learning style.
      </p>
      <p
        className={`mb-6 leading-relaxed ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-200'
        }`}
      >
        Our mission is to make high-quality education accessible to everyone,
        anywhere, at any time. We believe that with the right tools and support,
        every learner can achieve their full potential.
      </p>
      <h3
        className={`text-2xl font-semibold mb-4 ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}
      >
        Key Features:
      </h3>
      <ul
        className={`list-disc pl-6 mb-6 space-y-2 ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-200'
        }`}
      >
        <li>Personalized learning paths</li>
        <li>Real-time feedback and assessment</li>
        <li>Adaptive difficulty levels</li>
        <li>24/7 availability</li>
        <li>Multi-subject expertise</li>
      </ul>
      <p
        className={`leading-relaxed ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-200'
        }`}
      >
        Join us on this exciting journey to transform education and empower
        learners worldwide!
      </p>
    </div>
  );
};

export default AboutPage;

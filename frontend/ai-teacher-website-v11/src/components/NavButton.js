// components/NavButton.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Sliders,
  Info,
  Plus,
} from 'lucide-react';

const NavButton = ({ to, icon, label, theme, isLogo }) => {
  const location = useLocation();
  const active = location.pathname === to;

  const IconComponent = () => {
    switch (icon) {
      case 'BookOpen':
        return <BookOpen size={20} />;
      case 'Sliders':
        return <Sliders size={20} />;
      case 'Info':
        return <Info size={20} />;
      case 'Plus':
        return <Plus size={20} />;
      default:
        return null;
    }
  };

  if (isLogo) {
    return (
      <Link to={to} className="flex items-center">
        <img
          src={theme === 'light' ? '/logo_black.png' : '/logo_white.png'}
          alt="Logo"
          className="h-14 w-auto object-contain transition-transform duration-300 ease-in-out hover:scale-105"
        />
        <div className="ml-3 flex flex-col">
          <span
            className={`text-sm ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-300'
            }`}
          >
            presents
          </span>
          <span
            className={`text-xl font-bold ${
              theme === 'light' ? 'text-gray-800' : 'text-gray-100'
            }`}
          >
            {label}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        active
          ? theme === 'light'
            ? 'text-blue-600 bg-blue-50'
            : 'text-blue-300 bg-gray-700'
          : theme === 'light'
          ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          : 'text-gray-300 hover:text-blue-300 hover:bg-gray-700'
      }`}
    >
      {IconComponent()}
      <span className="ml-2">{label}</span>
    </Link>
  );
};

export default NavButton;

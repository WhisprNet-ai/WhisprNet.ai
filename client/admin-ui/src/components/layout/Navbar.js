import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../services/api';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    // Clear authentication data
    setAuthToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page (or create one if not exists)
    navigate('/login');
  };
  
  return (
    <nav className="bg-primary-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold">
                WhisprNet.ai
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600">
                Dashboard
              </Link>
              <Link to="/organizations" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600">
                Organizations
              </Link>
              <Link to="/invitations" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600">
                Invitations
              </Link>
              <Link to="/whispers" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600">
                Whispers
              </Link>
            </div>
          </div>
          <div className="hidden md:flex md:items-center">
            <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600">
              Profile
            </Link>
            <button 
              className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-600"
            >
              <svg 
                className="h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/dashboard" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/organizations" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Organizations
            </Link>
            <Link 
              to="/invitations" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Invitations
            </Link>
            <Link 
              to="/whispers" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Whispers
            </Link>
            <Link 
              to="/profile" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            <button 
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-600 hover:bg-red-700"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 
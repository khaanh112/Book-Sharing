import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/app-icon.png'
import NotificationBell from '../NotificationBell'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/my-hub', label: 'My Hub' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/profile', label: 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/my-hub') {
      return location.pathname.startsWith('/my-hub');
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#EC7FA9] to-[#BE5985] shadow-lg border-b-2 border-[#d5c2c2]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 transition-transform hover:scale-105">
            <img 
              src={logo} 
              alt="Book Sharing" 
              className="h-14 w-14 rounded-lg shadow-md object-cover" 
            />
          </Link>

          {/* Navigation Menu */}
          <nav className="flex-1 flex justify-center">
            <ul className="flex items-center space-x-8">
              {navLinks.map(({ path, label }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className={`text-lg font-semibold transition-all duration-200 ${
                      isActive(path)
                        ? 'text-white border-b-2 border-white pb-1'
                        : 'text-yellow-50 hover:text-white hover:scale-110'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Section - Notifications */}
          <div className="flex-shrink-0 flex items-center">
            {isAuthenticated && <NotificationBell />}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

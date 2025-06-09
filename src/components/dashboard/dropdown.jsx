"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const UserDropdownNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const navigationItems = [
    { href: '/find-peers', label: 'Find Peers' },
    { href: '/profile?direct=true', label: 'Profile' },
    { href: '/connections', label: 'Connections' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (href) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!user) return null;

  const getCurrentPageLabel = () => {
    const currentItem = navigationItems.find(item => item.href === pathname || item.href.split('?')[0] === pathname);
    return currentItem ? currentItem.label : 'Dashboard';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
      >
        <div className="text-white rounded-full flex items-center justify-center">
        </div>
        <span className="text-sm font-medium text-gray-700">{getCurrentPageLabel()}</span>
        <ChevronDown 
          size={16} 
          className={`text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>

            {navigationItems.map((item) => {
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}

            <div className="border-t border-gray-100 mt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdownNav;
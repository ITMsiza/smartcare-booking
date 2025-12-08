
'use client';

import React from 'react';
import Link from 'next/link';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import { useTheme } from 'next-themes';

// The NavLink can now have an href for navigation or an id for tab switching
interface NavLink {
  id?: string; // For tab switching
  href?: string; // For page navigation
  label: string;
}

interface SidebarProps {
  navLinks: NavLink[];
  onTabChange?: (id: string) => void; // Optional handler for tab switching
  activeTab?: string; // Optional prop to highlight the active tab
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ navLinks, onTabChange, activeTab, isSidebarOpen, setSidebarOpen }) => {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleNavigation = () => {
    if (window.innerWidth < 768) { // Only close on mobile
      setSidebarOpen(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="text-2xl font-bold text-center py-4 text-white">
        SmartCare Booking
      </div>
      <nav className="flex-grow">
        <ul>
          {navLinks.map((link, index) => {
            const isActive = link.id && link.id === activeTab;
            const itemClasses = `block w-full text-left py-2.5 px-4 rounded transition duration-200 ${isActive ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'}`;

            return (
              <li key={index}>
                {link.href ? (
                  <Link href={link.href} className={itemClasses} onClick={handleNavigation}>
                    {link.label}
                  </Link>
                ) : (
                  <button onClick={() => {
                    if (onTabChange) onTabChange(link.id!);
                    handleNavigation();
                  }} className={itemClasses}>
                    {link.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex flex-col space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center w-full py-2.5 px-4 rounded transition duration-200 text-indigo-100 hover:bg-indigo-600 hover:text-white"
        >
          {theme === 'dark' ? <Sun className="mr-2 h-5 w-5" /> : <Moon className="mr-2 h-5 w-5" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center w-full py-2.5 px-4 rounded transition duration-200 text-indigo-100 hover:bg-indigo-600 hover:text-white"
        >
          <LogOut className="mr-2 h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black opacity-50 z-20 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-indigo-700 p-4 shadow-lg z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;

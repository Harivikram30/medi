import React, { useState, useEffect, useRef } from 'react';
import type { User, Page } from '../types';

interface NavbarProps {
  user: User | null;
  onNavigate: (page: Page) => void;
  onLoginClick: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const NavLink: React.FC<{ page: Page; current?: Page; onNavigate: (page: Page) => void; children: React.ReactNode }> = ({ page, onNavigate, children }) => (
  <button onClick={() => onNavigate(page)} className="text-gray-600 dark:text-dark-text hover:text-primary dark:hover:text-white transition duration-300 px-3 py-2 rounded-md text-sm font-medium">
    {children}
  </button>
);

const Navbar: React.FC<NavbarProps> = ({ user, onNavigate, onLoginClick, onLogout, theme, toggleTheme }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when a navigation link is clicked
  const handleMobileNav = (page: Page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const getUserPortalPage = (): Page => {
    if (!user) return 'Home';
    switch (user.role) {
      case 'PATIENT': return 'Patient Portal';
      case 'DOCTOR': return 'Doctor Portal';
      case 'NURSE': return 'Nurse Portal';
      case 'PHARMACY': return 'Pharmacy Portal';
      case 'LAB_TECHNICIAN': return 'Lab Portal';
      case 'ADMIN': return 'Admin Dashboard';
      default: return 'Home';
    }
  };

  const renderPortalLink = () => {
    if (!user) return null;
    const page = getUserPortalPage();
    // FIX: Explicitly type `text` as a string. `page` is of type `Page`, which was inferred for `text`.
    // The string "My Portal" is not a valid `Page` type, causing a TypeScript error.
    let text: string = page; // Default to the page name
    if (user.role === 'PATIENT') {
        text = 'My Portal';
    }
    return <NavLink page={page} onNavigate={handleMobileNav}>{text}</NavLink>;
  };

  const ThemeToggleButton = () => (
    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
      {theme === 'light' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  return (
    <nav className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => onNavigate('Home')} className="flex-shrink-0 flex items-center gap-2.5 group">
              <img
                src="/logo-icon.png"
                alt="MediConnect Logo"
                className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-xl font-bold tracking-tight text-primary flex items-center">
                Medi<span className="text-secondary">Connect</span>
              </span>
            </button>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink page="Home" onNavigate={onNavigate}>Home</NavLink>
                <NavLink page="About Us" onNavigate={onNavigate}>About Us</NavLink>
                <NavLink page="Services" onNavigate={onNavigate}>Services</NavLink>
                <NavLink page="WayFinder" onNavigate={onNavigate}>
                  <span className="inline-flex items-center gap-1">
                    <span>🧭</span> WayFinder
                  </span>
                </NavLink>
                <NavLink page="Contact" onNavigate={onNavigate}>Contact</NavLink>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-4">
              <ThemeToggleButton />
              {user ? (
                 <div className="relative" ref={userMenuRef}>
                    <button 
                        onClick={() => setUserMenuOpen(!isUserMenuOpen)} 
                        className="flex items-center gap-2 bg-light dark:bg-dark-bg p-1 pr-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        aria-expanded={isUserMenuOpen}
                        aria-haspopup="true"
                    >
                        <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full ring-2 ring-primary/50" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-dark-text">{user.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fadeIn" role="menu" aria-orientation="vertical">
                            <div className="py-1" role="none">
                                <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-border">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white" role="none">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400" role="none">{user.email}</p>
                                </div>
                                <button onClick={() => { onNavigate(getUserPortalPage()); setUserMenuOpen(false); }} className="w-full text-left text-gray-700 dark:text-dark-text block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                                    {user.role === 'PATIENT' ? 'My Portal' : getUserPortalPage()}
                                </button>
                                <button onClick={() => { onLogout(); setUserMenuOpen(false); }} className="w-full text-left text-red-600 dark:text-red-400 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                 </div>
              ) : (
                <button onClick={onLoginClick} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-300 shadow-glow-primary hover:shadow-glow-primary-hover hover:-translate-y-0.5">
                  Patient/Staff Login
                </button>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="bg-gray-200 dark:bg-dark-card inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-dark-text hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-200 focus:ring-white">
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && (
              <div className="px-2 py-3 mb-3 border-b border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-4">
                  <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full ring-2 ring-primary/50" />
                  <div>
                    <p className="font-bold text-lg text-gray-800 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <NavLink page="Home" onNavigate={handleMobileNav}>Home</NavLink>
            <NavLink page="About Us" onNavigate={handleMobileNav}>About Us</NavLink>
            <NavLink page="Services" onNavigate={handleMobileNav}>Services</NavLink>
            <NavLink page="WayFinder" onNavigate={handleMobileNav}>🧭 WayFinder Maps</NavLink>
            <NavLink page="Contact" onNavigate={handleMobileNav}>Contact</NavLink>
            {renderPortalLink()}
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between px-2 py-2">
                <p className="text-sm font-medium text-gray-600 dark:text-dark-text">Toggle Theme</p>
                <ThemeToggleButton />
              </div>
              <div className="mt-2 px-2">
                {user ? (
                  <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="w-full text-center bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-3 py-2 rounded-md text-base font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition">
                    Logout
                  </button>
                ) : (
                  <button onClick={() => { onLoginClick(); setMobileMenuOpen(false); }} className="w-full text-center bg-primary text-white px-3 py-2 rounded-md text-base font-medium hover:bg-primary/90 transition">
                    Patient/Staff Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
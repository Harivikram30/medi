import React, { useState, useMemo } from 'react';
import type { Role, User, Page } from '../types';
import { MOCK_USERS } from '../constants';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (email: string, password: string, role: Role) => 'unverified' | 'failed' | void;
  loginError: string;
  allUsers: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentPage: (page: Page) => void;
}

type ModalView = 'role' | 'patientType' | 'login' | 'signup' | 'signupSuccess' | 'verifyEmail';

const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLogin,
  loginError,
  allUsers,
  setUsers,
  setCurrentUser,
  setCurrentPage
}) => {
  const [view, setView] = useState<ModalView>('role');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  
  // State for user needing verification
  const [userToVerify, setUserToVerify] = useState<User | null>(null);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    if (selectedRole === 'PATIENT') {
        setView('patientType');
    } else {
        setView('login');
    }
  };
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      const result = onLogin(email, password, role);
      if (result === 'unverified') {
        const unverifiedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
        if (unverifiedUser) {
          setUserToVerify(unverifiedUser);
          setView('verifyEmail');
        }
      }
    }
  };
  
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (allUsers.some(u => u.email.toLowerCase() === signupEmail.toLowerCase())) {
        setSignupError('An account with this email already exists.');
        return;
    }
    
    const newUser: User = {
        id: `p_${new Date().getTime()}`,
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        role: 'PATIENT',
        avatarUrl: `https://ui-avatars.com/api/?name=${signupName.replace(' ', '+')}&background=0057A8&color=fff`,
        isVerified: true, // Automatically verify new users for demo purposes
    };

    setUsers(prev => [...prev, newUser]);
    setView('signupSuccess');
  };

  const handleManualVerify = () => {
    if (!userToVerify) return;
    setUsers(prevUsers => prevUsers.map(u => 
        u.id === userToVerify.id ? { ...u, isVerified: true } : u
    ));
    setUserToVerify(null);
    setEmail('');
    setPassword('');
    setView('login');
    alert("Account verified successfully! You can now log in.");
  };

  const demoUsersForRole = useMemo(() => {
    if (!role) return [];
    return MOCK_USERS.filter(user => user.role === role);
  }, [role]);

  const renderContent = () => {
    switch (view) {
      case 'role':
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Select Your Role</h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {(['PATIENT', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACY', 'ADMIN'] as Role[]).map(r => (
                  <button key={r} onClick={() => handleRoleSelect(r)} className="p-4 border rounded-lg text-center hover:bg-light dark:hover:bg-dark-bg hover:border-primary transition dark:border-gray-600 dark:text-gray-200">
                    {r.replace('_', ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
                  </button>
              ))}
            </div>
          </>
        );
        
      case 'patientType':
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Patient Portal Access</h2>
             <p className="mt-2 text-gray-600 dark:text-gray-400">Are you a new or existing patient?</p>
            <div className="mt-6 flex flex-col gap-4">
              <button onClick={() => setView('login')} className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition">
                Existing Patient Login
              </button>
              <button onClick={() => setView('signup')} className="w-full bg-secondary text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition">
                New Patient Sign Up
              </button>
            </div>
             <button onClick={() => setView('role')} className="mt-4 text-sm text-gray-500 hover:underline dark:text-gray-400">Back to role selection</button>
          </>
        );

      case 'login':
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">
              Login as {role && role.replace('_', ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
            </h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4 mt-6">
                <div>
                    <label htmlFor="email-login" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input id="email-login" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="you@example.com" />
                </div>
                <div>
                    <label htmlFor="password-login" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="••••••••" />
                </div>
                {loginError && <p className="text-sm text-red-500">{loginError}</p>}
                <button type="submit" className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Login</button>
            </form>
            <div className="mt-4 p-3 bg-light dark:bg-dark-bg rounded-lg border dark:border-dark-border text-xs text-gray-600 dark:text-gray-400">
                <strong className='block text-center'>For Demo:</strong> 
                <p className='text-center mb-2'>Use one of the following credentials:</p>
                <div className="text-left max-h-24 overflow-y-auto space-y-2 p-2 bg-white dark:bg-dark-bg rounded ring-1 ring-gray-200 dark:ring-gray-700">
                    {demoUsersForRole.map(user => (
                        <div key={user.id}>
                            <code>{user.email}</code>
                            <br/>
                            <code className="pl-2">p: {user.password}</code>
                        </div>
                    ))}
                </div>
            </div>
             <button onClick={() => {
                setEmail('');
                setPassword('');
                setView(role === 'PATIENT' ? 'patientType' : 'role');
             }} className="mt-4 text-sm text-gray-500 hover:underline dark:text-gray-400">Back</button>
          </>
        );
        
      case 'signup':
        return (
             <>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">New Patient Registration</h2>
                <form onSubmit={handleSignupSubmit} className="space-y-4 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="John Doe" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="you@example.com" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Create Password</label>
                        <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="••••••••" />
                    </div>
                    {signupError && <p className="text-sm text-red-500">{signupError}</p>}
                    <button type="submit" className="w-full bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Register Account</button>
                </form>
                <button onClick={() => {
                  setSignupName('');
                  setSignupEmail('');
                  setSignupPassword('');
                  setSignupError('');
                  setView('patientType');
                }} className="mt-4 text-sm text-gray-500 hover:underline dark:text-gray-400">Back</button>
             </>
        );
        
      case 'signupSuccess':
        return (
          <>
            <div className="text-center">
                 <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-dark-text">Registration Successful!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Your account is ready. You can now log in.</p>
                <button
                    onClick={() => {
                      setEmail('');
                      setPassword('');
                      setView('login');
                    }}
                    className="mt-6 w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition"
                >
                    Back to Login
                </button>
            </div>
          </>
        );
      
      case 'verifyEmail':
        return (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Verify Your Account</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                The account for <span className="font-semibold">{userToVerify?.email}</span> is not yet verified. Please check your email for a verification link.
              </p>
              <div className="mt-6 bg-yellow-100 dark:bg-yellow-900/50 p-4 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  For demonstration purposes, you can manually verify the account below.
                </p>
                <button onClick={handleManualVerify} className="mt-3 w-full bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">
                  Verify Account (Demo)
                </button>
              </div>
              <button onClick={() => {
                  setEmail('');
                  setPassword('');
                  setUserToVerify(null);
                  setView('login');
              }} className="mt-4 text-sm text-gray-500 hover:underline dark:text-gray-400">
                Back to Login
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="flex justify-end items-center mb-2 absolute top-4 right-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginModal;
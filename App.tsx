import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { User, Page, Role, Medicine, Appointment, Invoice, Prescription, LabTest } from './types';
import { MOCK_USERS, MOCK_MEDICINES, MOCK_APPOINTMENTS, MOCK_INVOICES, MOCK_PRESCRIPTIONS, MOCK_LAB_TESTS } from './constants';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/PatientPortal/ServicesPage';
import ContactPage from './pages/ContactPage';
import PatientPortal from './pages/PatientPortal/PatientPortal';
import DoctorPortal from './pages/DoctorPortal/DoctorPortal';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import LoginModal from './components/LoginModal';
import HealthAssistant from './components/HealthAssistant';
import HandsFreePatientAccess from './components/Accessibility/HandsFreePatientAccess';
import NursePortal from './pages/NursePortal/NursePortal';
import PharmacyPortal from './pages/PharmacyPortal/PharmacyPortal';
import LabPortal from './pages/LabPortal/LabPortal';
import WayFinderPage from './pages/WayFinderPage';
import ErrorBoundary from './components/ErrorBoundary';
import { isDatabaseConfigured } from './services/supabaseClient';
import { loadCollections, syncCollection, setupRealtimeSubscriptions, checkDatabaseHealth } from './services/database';
import {
  sanitizeAppointment,
  sanitizePrescription,
  sanitizeMedicine,
  sanitizeInvoice,
  sanitizeLabTest,
  sanitizeUser
} from './services/dataSanitizer';

type Theme = 'light' | 'dark';
type ConnectionStatus = 'connected' | 'connecting' | 'offline' | 'error';

const parseInitialRoute = (): { page: Page; dest?: string } => {
  try {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page');
      const destParam = urlParams.get('dest');
      const hash = window.location.hash.toLowerCase();

      if (pageParam === 'WayFinder' || destParam || hash.includes('wayfinder')) {
        return { page: 'WayFinder', dest: destParam || undefined };
      }
      if (pageParam === 'Services' || hash.includes('services')) return { page: 'Services' };
      if (pageParam === 'About Us' || hash.includes('about')) return { page: 'About Us' };
      if (pageParam === 'Contact' || hash.includes('contact')) return { page: 'Contact' };
    }
  } catch (e) {
    console.error('Error parsing initial route from URL:', e);
  }
  return { page: 'Home' };
};

const App: React.FC = () => {
  const initialRoute = useMemo(() => parseInitialRoute(), []);
  const [currentPage, setCurrentPage] = useState<Page>(initialRoute.page);
  const [wayfinderInitialDest, setWayfinderInitialDest] = useState<string | undefined>(initialRoute.dest);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [theme, setTheme] = useState<Theme>('light');
  const logoutTimer = useRef<number | null>(null);

  // Connection & Fault Tolerance State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    isDatabaseConfigured ? (typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'connecting') : 'connected'
  );
  const [connectionError, setConnectionError] = useState<string>('');
  const [isUsingCachedData, setIsUsingCachedData] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('hms_last_sync') || null;
    } catch {
      return null;
    }
  });
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    const handleUrlChange = () => {
      const route = parseInitialRoute();
      setCurrentPage(route.page);
      if (route.dest) {
        setWayfinderInitialDest(route.dest);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);
  
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('hms_users');
      return savedUsers ? JSON.parse(savedUsers).map(sanitizeUser) : MOCK_USERS;
    } catch (error) {
      console.error("Failed to load users from localStorage", error);
      return MOCK_USERS;
    }
  });
  
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    try {
      const savedMedicines = localStorage.getItem('hms_medicines');
      return savedMedicines ? JSON.parse(savedMedicines).map(sanitizeMedicine) : MOCK_MEDICINES;
    } catch (error) {
      console.error("Failed to load medicines from localStorage", error);
      return MOCK_MEDICINES;
    }
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const savedAppointments = localStorage.getItem('hms_appointments');
      return savedAppointments ? JSON.parse(savedAppointments).map(sanitizeAppointment) : MOCK_APPOINTMENTS;
    } catch (error) {
      console.error("Failed to load appointments from localStorage", error);
      return MOCK_APPOINTMENTS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const savedInvoices = localStorage.getItem('hms_invoices');
      return savedInvoices ? JSON.parse(savedInvoices).map(sanitizeInvoice) : MOCK_INVOICES;
    } catch (error) {
      console.error("Failed to load invoices from localStorage", error);
      return MOCK_INVOICES;
    }
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    try {
      const savedPrescriptions = localStorage.getItem('hms_prescriptions');
      return savedPrescriptions ? JSON.parse(savedPrescriptions).map(sanitizePrescription) : MOCK_PRESCRIPTIONS;
    } catch (error) {
      console.error("Failed to load prescriptions from localStorage", error);
      return MOCK_PRESCRIPTIONS;
    }
  });

  const [labTests, setLabTests] = useState<LabTest[]>(() => {
    try {
      const savedLabTests = localStorage.getItem('hms_lab_tests');
      return savedLabTests ? JSON.parse(savedLabTests).map(sanitizeLabTest) : MOCK_LAB_TESTS;
    } catch (error) {
      console.error("Failed to load lab tests from localStorage", error);
      return MOCK_LAB_TESTS;
    }
  });

  const [databaseReady, setDatabaseReady] = useState(!isDatabaseConfigured);

  // Safe data-loading procedure that handles empty tables, timeouts, and network outages
  const loadDatabaseData = useCallback(async () => {
    if (!isDatabaseConfigured) {
      setConnectionStatus('connected');
      setDatabaseReady(true);
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setConnectionStatus('offline');
      setIsUsingCachedData(true);
      setConnectionError('Device is currently offline. Showing locally cached data.');
      setDatabaseReady(true);
      return;
    }

    setConnectionStatus('connecting');
    setConnectionError('');
    setIsBannerDismissed(false);

    try {
      const collections = await loadCollections(8000);
      
      const hasCollections = Boolean(
        collections.users !== undefined ||
        collections.medicines !== undefined ||
        collections.appointments !== undefined ||
        collections.invoices !== undefined ||
        collections.prescriptions !== undefined ||
        collections.lab_tests !== undefined
      );

      if (hasCollections) {
        if (collections.users !== undefined) setUsers(collections.users as User[]);
        if (collections.medicines !== undefined) setMedicines(collections.medicines as Medicine[]);
        if (collections.appointments !== undefined) setAppointments(collections.appointments as Appointment[]);
        if (collections.invoices !== undefined) setInvoices(collections.invoices as Invoice[]);
        if (collections.prescriptions !== undefined) setPrescriptions(collections.prescriptions as Prescription[]);
        if (collections.lab_tests !== undefined) setLabTests(collections.lab_tests as LabTest[]);

        setConnectionStatus('connected');
        setIsUsingCachedData(false);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(timeStr);
        try {
          localStorage.setItem('hms_last_sync', timeStr);
        } catch {}
        setDatabaseReady(true);
      } else {
        // Double check health
        const health = await checkDatabaseHealth(4000);
        if (health.isOnline) {
          setConnectionStatus('connected');
          setIsUsingCachedData(false);
          setDatabaseReady(true);
        } else {
          setConnectionStatus('error');
          setIsUsingCachedData(true);
          setConnectionError(health.error || 'Centralized database is currently unreachable. Displaying cached records.');
          setDatabaseReady(true);
        }
      }
    } catch (error: any) {
      console.warn('Failed to load data from Supabase, working from safe local cache:', error);
      setConnectionStatus('error');
      setIsUsingCachedData(true);
      setConnectionError(error?.message || 'Database connection error. Preserving existing local data.');
      setDatabaseReady(true);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();

    const handleOnline = () => {
      loadDatabaseData();
    };
    const handleOffline = () => {
      setConnectionStatus('offline');
      setIsUsingCachedData(true);
      setConnectionError('Internet connection lost. Working with locally cached data.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadDatabaseData]);

  // Sync to remote database ONLY when online and connected, preventing silent overwrite/deletion
  useEffect(() => {
    if (databaseReady && connectionStatus === 'connected' && (!navigator || navigator.onLine)) {
      syncCollection('users', users).catch(error => console.warn('Failed to sync users', error));
    }
  }, [users, databaseReady, connectionStatus]);

  useEffect(() => {
    if (databaseReady && connectionStatus === 'connected' && (!navigator || navigator.onLine)) {
      syncCollection('medicines', medicines).catch(error => console.warn('Failed to sync medicines', error));
    }
  }, [medicines, databaseReady, connectionStatus]);

  useEffect(() => {
    if (databaseReady && connectionStatus === 'connected' && (!navigator || navigator.onLine)) {
      syncCollection('appointments', appointments).catch(error => console.warn('Failed to sync appointments', error));
    }
  }, [appointments, databaseReady, connectionStatus]);

  useEffect(() => {
    if (databaseReady && connectionStatus === 'connected' && (!navigator || navigator.onLine)) {
      syncCollection('invoices', invoices).catch(error => console.warn('Failed to sync invoices', error));
    }
  }, [invoices, databaseReady, connectionStatus]);

  useEffect(() => {
    if (databaseReady && connectionStatus === 'connected' && (!navigator || navigator.onLine)) {
      syncCollection('prescriptions', prescriptions).catch(error => console.warn('Failed to sync prescriptions', error));
    }
  }, [prescriptions, databaseReady, connectionStatus]);

  useEffect(() => {
    if (databaseReady && connectionStatus === 'connected' && (!navigator || navigator.onLine)) {
      syncCollection('lab_tests', labTests).catch(error => console.warn('Failed to sync lab tests', error));
    }
  }, [labTests, databaseReady, connectionStatus]);

  // Real-time synchronization across all six portals and devices with sanitized data guards
  useEffect(() => {
    if (!isDatabaseConfigured) return;

    const unsubscribe = setupRealtimeSubscriptions(event => {
      try {
        const { table, eventType, newRecord, oldRecord } = event;
        
        if (table === 'appointments') {
          if (eventType === 'DELETE' && oldRecord) {
            setAppointments(prev => prev.filter(a => a.id !== oldRecord.id));
          } else if (newRecord) {
            const mapped = sanitizeAppointment(newRecord);
            setAppointments(prev => {
              const index = prev.findIndex(a => a.id === mapped.id);
              return index > -1 ? prev.map(a => a.id === mapped.id ? mapped : a) : [mapped, ...prev];
            });
          }
        } else if (table === 'prescriptions') {
          if (eventType === 'DELETE' && oldRecord) {
            setPrescriptions(prev => prev.filter(p => p.id !== oldRecord.id));
          } else if (newRecord) {
            const mapped = sanitizePrescription(newRecord);
            setPrescriptions(prev => {
              const index = prev.findIndex(p => p.id === mapped.id);
              return index > -1 ? prev.map(p => p.id === mapped.id ? mapped : p) : [mapped, ...prev];
            });
          }
        } else if (table === 'medicines') {
          if (eventType === 'DELETE' && oldRecord) {
            setMedicines(prev => prev.filter(m => m.id !== oldRecord.id));
          } else if (newRecord) {
            const mapped = sanitizeMedicine(newRecord);
            setMedicines(prev => {
              const index = prev.findIndex(m => m.id === mapped.id);
              return index > -1 ? prev.map(m => m.id === mapped.id ? mapped : m) : [...prev, mapped];
            });
          }
        } else if (table === 'invoices') {
          if (eventType === 'DELETE' && oldRecord) {
            setInvoices(prev => prev.filter(i => i.id !== oldRecord.id));
          } else if (newRecord) {
            const mapped = sanitizeInvoice(newRecord);
            setInvoices(prev => {
              const index = prev.findIndex(i => i.id === mapped.id);
              return index > -1 ? prev.map(i => i.id === mapped.id ? mapped : i) : [mapped, ...prev];
            });
          }
        } else if (table === 'lab_tests') {
          if (eventType === 'DELETE' && oldRecord) {
            setLabTests(prev => prev.filter(l => l.id !== oldRecord.id));
          } else if (newRecord) {
            const mapped = sanitizeLabTest(newRecord);
            setLabTests(prev => {
              const index = prev.findIndex(l => l.id === mapped.id);
              return index > -1 ? prev.map(l => l.id === mapped.id ? mapped : l) : [mapped, ...prev];
            });
          }
        } else if (table === 'profiles') {
          if (eventType === 'DELETE' && oldRecord) {
            setUsers(prev => prev.filter(u => u.id !== oldRecord.id));
          } else if (newRecord) {
            const mapped = sanitizeUser(newRecord);
            setUsers(prev => {
              const index = prev.findIndex(u => u.id === mapped.id);
              return index > -1 ? prev.map(u => u.id === mapped.id ? mapped : u) : [...prev, mapped];
            });
          }
        }
      } catch (rtErr) {
        console.warn('Realtime event processing error safely trapped:', rtErr);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);
  
  // Safe localStorage caching
  useEffect(() => {
    try {
      localStorage.setItem('hms_users', JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to localStorage", error);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('hms_medicines', JSON.stringify(medicines));
    } catch (error) {
      console.error("Failed to save medicines to localStorage", error);
    }
  }, [medicines]);

  useEffect(() => {
    try {
      localStorage.setItem('hms_appointments', JSON.stringify(appointments));
    } catch (error) {
      console.error("Failed to save appointments to localStorage", error);
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem('hms_invoices', JSON.stringify(invoices));
    } catch (error) {
      console.error("Failed to save invoices to localStorage", error);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem('hms_prescriptions', JSON.stringify(prescriptions));
    } catch (error) {
      console.error("Failed to save prescriptions to localStorage", error);
    }
  }, [prescriptions]);

  useEffect(() => {
    try {
      localStorage.setItem('hms_lab_tests', JSON.stringify(labTests));
    } catch (error) {
      console.error("Failed to save lab tests to localStorage", error);
    }
  }, [labTests]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentPage('Home');
  }, []);

  const resetTimer = useCallback(() => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }
    logoutTimer.current = window.setTimeout(() => {
      if (currentUser) {
        handleLogout();
        alert("You have been logged out due to inactivity.");
      }
    }, 15 * 60 * 1000); // 15 minutes
  }, [currentUser, handleLogout]);

  useEffect(() => {
    if (currentUser) {
      const events = ['mousemove', 'keypress', 'scroll', 'click'];
      events.forEach(event => window.addEventListener(event, resetTimer));
      resetTimer();

      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimer));
        if (logoutTimer.current) {
          clearTimeout(logoutTimer.current);
        }
      };
    }
  }, [currentUser, resetTimer]);

  const handleLogin = (email: string, password: string, role: Role) => {
    const user = users.find(
      u => u && u.email && u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role
    );
    if (user) {
      if (!user.isVerified && user.role === 'PATIENT') {
        setLoginError('This account has not been verified. Please check your email.');
        return 'unverified';
      }
      setCurrentUser(user);
      switch (user.role) {
        case 'PATIENT':
          setCurrentPage('Patient Portal');
          break;
        case 'DOCTOR':
          setCurrentPage('Doctor Portal');
          break;
        case 'NURSE':
          setCurrentPage('Nurse Portal');
          break;
        case 'PHARMACY':
          setCurrentPage('Pharmacy Portal');
          break;
        case 'LAB_TECHNICIAN':
          setCurrentPage('Lab Portal');
          break;
        case 'ADMIN':
          setCurrentPage('Admin Dashboard');
          break;
      }
      setLoginModalOpen(false);
      setLoginError('');
    } else {
      setLoginError('Invalid email, password, or role. Please try again.');
    }
    return 'failed';
  };

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  // Isolated Error Boundaries around each portal prevent any single component or missing record from crashing the entire app
  const renderPage = useMemo(() => {
    switch (currentPage) {
      case 'Home':
        return <HomePage navigate={navigate} />;
      case 'About Us':
        return <AboutPage />;
      case 'Services':
        return <ServicesPage navigate={navigate} />;
      case 'Contact':
        return <ContactPage />;
      case 'WayFinder':
        return (
          <ErrorBoundary isolate fallbackTitle="WayFinder Navigation Error" fallbackMessage="WayFinder encountered an issue. Standard hospital directions remain available.">
            <WayFinderPage initialDestinationId={wayfinderInitialDest} />
          </ErrorBoundary>
        );
      case 'Patient Portal':
        return currentUser?.role === 'PATIENT' ? (
          <ErrorBoundary isolate fallbackTitle="Patient Portal Error" fallbackMessage="Patient Portal encountered an unexpected issue. Your session and other hospital portals remain functional.">
            <PatientPortal user={currentUser} appointments={appointments} setAppointments={setAppointments} prescriptions={prescriptions} labTests={labTests} invoices={invoices} setInvoices={setInvoices} onNavigate={navigate} />
          </ErrorBoundary>
        ) : <HomePage navigate={navigate} />;
      case 'Doctor Portal':
        return currentUser?.role === 'DOCTOR' ? (
          <ErrorBoundary isolate fallbackTitle="Doctor Portal Error" fallbackMessage="Doctor Portal encountered an issue. Other clinical services remain unaffected.">
            <DoctorPortal user={currentUser} appointments={appointments} setAppointments={setAppointments} prescriptions={prescriptions} setPrescriptions={setPrescriptions} labTests={labTests} />
          </ErrorBoundary>
        ) : <HomePage navigate={navigate} />;
      case 'Admin Dashboard':
        return currentUser?.role === 'ADMIN' ? (
          <ErrorBoundary isolate fallbackTitle="Admin Dashboard Error" fallbackMessage="Admin Dashboard encountered an issue. Hospital operations continue uninterrupted.">
            <AdminDashboard user={currentUser} allUsers={users} setUsers={setUsers} medicines={medicines} setMedicines={setMedicines} invoices={invoices} setInvoices={setInvoices} appointments={appointments} setAppointments={setAppointments} />
          </ErrorBoundary>
        ) : <HomePage navigate={navigate} />;
      case 'Nurse Portal':
        return currentUser?.role === 'NURSE' ? (
          <ErrorBoundary isolate fallbackTitle="Nurse Portal Error" fallbackMessage="Nurse Portal encountered an issue. Patient care tools and pages remain intact.">
            <NursePortal user={currentUser} appointments={appointments} allUsers={users} />
          </ErrorBoundary>
        ) : <HomePage navigate={navigate} />;
      case 'Pharmacy Portal':
        return currentUser?.role === 'PHARMACY' ? (
          <ErrorBoundary isolate fallbackTitle="Pharmacy Portal Error" fallbackMessage="Pharmacy Portal encountered an issue. Inventory data is safely preserved.">
            <PharmacyPortal user={currentUser} medicines={medicines} setMedicines={setMedicines} prescriptions={prescriptions} setPrescriptions={setPrescriptions} />
          </ErrorBoundary>
        ) : <HomePage navigate={navigate} />;
      case 'Lab Portal':
        return currentUser?.role === 'LAB_TECHNICIAN' ? (
          <ErrorBoundary isolate fallbackTitle="Lab Portal Error" fallbackMessage="Lab Portal encountered an issue. Diagnostic records remain safe.">
            <LabPortal user={currentUser} labTests={labTests} setLabTests={setLabTests} />
          </ErrorBoundary>
        ) : <HomePage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  }, [currentPage, currentUser, navigate, users, medicines, appointments, invoices, prescriptions, labTests, wayfinderInitialDest]);

  return (
    <ErrorBoundary>
      <div className="bg-light dark:bg-dark-bg min-h-screen flex flex-col font-sans">
        <Navbar 
          user={currentUser} 
          onNavigate={navigate} 
          onLoginClick={() => setLoginModalOpen(true)}
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Global Network / Database Connection Status Banner */}
        {isDatabaseConfigured && !isBannerDismissed && (connectionStatus === 'offline' || connectionStatus === 'error' || isUsingCachedData) && (
          <div className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b flex items-center justify-between gap-3 ${
            connectionStatus === 'offline' 
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800' 
              : connectionStatus === 'error'
              ? 'bg-red-50 dark:bg-red-950/80 text-red-900 dark:text-red-200 border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{connectionStatus === 'offline' ? '📡' : '⚠️'}</span>
              <span>
                <strong>
                  {connectionStatus === 'offline' ? 'Offline Mode:' : connectionStatus === 'error' ? 'Database Unavailable:' : 'Cached Data:'}
                </strong>{' '}
                {connectionError || 'Working with locally cached records (data may be outdated). Existing records are safely preserved without overwrite.'}
                {lastSyncTime && <span className="opacity-75 ml-1.5">(Last synced at {lastSyncTime})</span>}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => loadDatabaseData()}
                className="bg-white dark:bg-dark-card border border-current px-2.5 py-1 rounded-md text-xs font-bold hover:opacity-80 transition shadow-sm"
              >
                🔄 Retry Connection
              </button>
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="opacity-60 hover:opacity-100 p-1"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="flex-grow">
          {renderPage}
        </main>
        <Footer onNavigate={navigate} user={currentUser} onLoginClick={() => setLoginModalOpen(true)} />
        {isLoginModalOpen && (
          <LoginModal 
            onClose={() => {
              setLoginModalOpen(false);
              setLoginError('');
            }} 
            onLogin={handleLogin}
            loginError={loginError}
            allUsers={users}
            setUsers={setUsers}
            setCurrentUser={setCurrentUser}
            setCurrentPage={setCurrentPage}
          />
        )}
        {currentUser && (
          <ErrorBoundary isolate fallbackTitle="MediBot Assistant" fallbackMessage="MediBot is temporarily unavailable.">
            <HealthAssistant users={users} medicines={medicines} appointments={appointments} />
          </ErrorBoundary>
        )}
        <ErrorBoundary isolate fallbackTitle="Accessibility Assistant" fallbackMessage="Voice accessibility is temporarily disabled.">
          <HandsFreePatientAccess
            user={currentUser}
            appointments={appointments}
            labTests={labTests}
            onNavigate={navigate}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default App;

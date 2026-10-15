
import React, { useState, useEffect } from 'react';
import type { User, Appointment, Prescription, LabTest } from '../../types';
import Appointments from './Appointments';
import MedicalRecords from './MedicalRecords';
import BillingHistory from './BillingHistory';
import WellnessTracker from './WellnessTracker';
import SymptomChecker from './SymptomChecker';
import Prescriptions from './Prescriptions';
import MediSilentAlertSection from './MediSilentAlertSection';
import MediSilentAlertModal from '../../components/MediSilentAlert/MediSilentAlertModal';
import { MOCK_BILLS, MOCK_RECORDS, MOCK_WELLNESS_DATA, MOCK_DOCTORS, VERIFIED_ACCESSIBILITY_FACILITIES } from '../../constants';
import { getQueueForPatient, acknowledgeAlert } from '../../services/queueService';
import type { QueueEntry } from '../../types';

interface PatientPortalProps {
  user: User;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  prescriptions: Prescription[];
  labTests: LabTest[];
  onNavigate?: (page: any) => void;
}

type PatientTab = 'Dashboard' | 'Appointments' | 'Live Queue' | 'Medical Records' | 'Prescriptions' | 'Billing' | 'Wellness' | 'Symptom Checker';

const PatientDashboardSummary: React.FC<{
  user: User;
  setActiveTab: (tab: PatientTab) => void;
  appointments: Appointment[];
  prescriptions: Prescription[];
  queueEntry?: QueueEntry;
  onOpenAlertModal: () => void;
  onAcknowledgeAlert: () => void;
  onNavigate?: (page: any) => void;
}> = ({ user, setActiveTab, appointments, prescriptions, queueEntry, onOpenAlertModal, onAcknowledgeAlert, onNavigate }) => {
    const nextAppointment = appointments
        .filter(app => app.patientId === user.id && app.status === 'Upcoming')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const recentRecord = MOCK_RECORDS
        .filter(rec => rec.patientId === user.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const outstandingBill = MOCK_BILLS
        .filter(bill => bill.patientId === user.id && bill.status === 'Due')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
    const wellnessEntryCount = MOCK_WELLNESS_DATA.filter(w => w.patientId === user.id).length;

    const latestPrescription = prescriptions
        .filter(p => p.status === 'Active')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return (
        <div>
            {/* High-Visibility "Your Turn" Silent Visual Alert Banner */}
            {queueEntry?.status === 'Your Turn' && (
              <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl border-2 border-emerald-300 animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                    <span className="text-xs uppercase font-extrabold tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                      MediSilentAlert • Urgent
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">
                    IT'S YOUR TURN! (Token {queueEntry.tokenNumber})
                  </h3>
                  <p className="text-sm text-emerald-100 font-medium">
                    Please proceed immediately to <strong>{queueEntry.roomNumber}</strong> for consultation with {queueEntry.doctorName}.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={onAcknowledgeAlert}
                    className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold py-2.5 px-5 rounded-xl shadow transition text-sm flex items-center gap-1.5"
                  >
                    <span>👋</span> I'm On My Way
                  </button>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('WayFinder')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow transition text-sm flex items-center gap-1.5"
                      title="Open interactive floor plan to reach your consultation room"
                    >
                      <span>🧭</span> WayFinder Map
                    </button>
                  )}
                  <button
                    onClick={onOpenAlertModal}
                    className="bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-xl border border-white/20 transition text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text mb-6">Your Health Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Live OPD Queue Card */}
                <div className={`p-6 rounded-lg shadow transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:scale-105 border ${
                  queueEntry?.status === 'Your Turn'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400'
                    : 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">OPD Queue & Token</h3>
                      {queueEntry?.status === 'Your Turn' && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                          Your Turn
                        </span>
                      )}
                    </div>
                    {queueEntry ? (
                      <>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                            {queueEntry.tokenNumber}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Status: <strong className="text-gray-800 dark:text-gray-200">{queueEntry.status}</strong>
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">
                          📍 {queueEntry.roomNumber}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {queueEntry.doctorName} ({queueEntry.department})
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">No active queue token.</p>
                    )}
                    <button onClick={() => setActiveTab('Live Queue')} className="mt-4 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline text-sm flex items-center gap-1">
                      <span>Open MediSilentAlert™</span> →
                    </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg shadow transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:scale-105">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Upcoming Appointment</h3>
                     {nextAppointment ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{nextAppointment.doctorSpecialization} with {nextAppointment.doctorName}</p>
                            <p className="font-bold text-lg mt-1 dark:text-white">
                                {new Date(nextAppointment.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {nextAppointment.time}
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-400 mt-2">You have no upcoming appointments.</p>
                    )}
                    <button onClick={() => setActiveTab('Appointments')} className="mt-4 text-blue-600 dark:text-blue-400 font-semibold hover:underline">View All Appointments</button>
                </div>
                 <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg shadow transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:scale-105">
                    <h3 className="font-semibold text-teal-800 dark:text-teal-300">Latest Prescription</h3>
                     {latestPrescription ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{latestPrescription.medication}</p>
                            <p className="font-bold text-lg mt-1 dark:text-white">
                                Prescribed by {latestPrescription.doctorName}
                            </p>
                        </>
                     ) : (
                         <p className="text-gray-600 dark:text-gray-400 mt-2">No active prescriptions.</p>
                     )}
                    <button onClick={() => setActiveTab('Prescriptions')} className="mt-4 text-teal-600 dark:text-teal-400 font-semibold hover:underline">View All Prescriptions</button>
                </div>
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg shadow transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:scale-105">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Outstanding Bill</h3>
                     {outstandingBill ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{outstandingBill.service}</p>
                            <p className="font-bold text-lg mt-1 dark:text-white">${outstandingBill.amount.toFixed(2)} Due</p>
                        </>
                     ) : (
                        <p className="text-gray-600 dark:text-gray-400 mt-2">No outstanding bills.</p>
                     )}
                    <button onClick={() => setActiveTab('Billing')} className="mt-4 text-yellow-600 dark:text-yellow-400 font-semibold hover:underline">View Billing Details</button>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg shadow transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:scale-105">
                    <h3 className="font-semibold text-green-800 dark:text-green-300">Recent Medical Record</h3>
                     {recentRecord ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{recentRecord.title}</p>
                            <p className="font-bold text-lg mt-1 dark:text-white">
                                {new Date(recentRecord.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </>
                     ) : (
                         <p className="text-gray-600 dark:text-gray-400 mt-2">No records found.</p>
                     )}
                    <button onClick={() => setActiveTab('Medical Records')} className="mt-4 text-green-600 dark:text-green-400 font-semibold hover:underline">View All Records</button>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg shadow transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:scale-105">
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300">Wellness Tracker</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Log your vitals and track your progress.</p>
                     <p className="font-bold text-lg mt-1 dark:text-white">{wellnessEntryCount} entries logged</p>
                    <button onClick={() => setActiveTab('Wellness')} className="mt-4 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Open Tracker</button>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-lg shadow transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:scale-105">
                    <h3 className="font-semibold text-rose-800 dark:text-rose-300">Symptom Checker</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Get AI-powered insights on your symptoms.</p>
                     <p className="font-bold text-lg mt-1 dark:text-white">Powered by Gemini</p>
                    <button onClick={() => setActiveTab('Symptom Checker')} className="mt-4 text-rose-600 dark:text-rose-400 font-semibold hover:underline">Check Symptoms</button>
                </div>
            </div>
        </div>
    );
};

const PatientPortal: React.FC<PatientPortalProps> = ({ user, appointments, setAppointments, prescriptions, labTests, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<PatientTab>('Dashboard');
  const [queueEntry, setQueueEntry] = useState<QueueEntry | undefined>(() => getQueueForPatient(user.id));
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isFacilitiesModalOpen, setIsFacilitiesModalOpen] = useState(false);
  const patientPrescriptions = prescriptions.filter(p => p.patientId === user.id);

  // Sync queue entry changes
  useEffect(() => {
    const refreshQueue = () => {
      const q = getQueueForPatient(user.id);
      setQueueEntry(q);
      if (q?.status === 'Your Turn') {
        setIsAlertModalOpen(true);
      }
    };

    window.addEventListener('mediconnect_queue_change', refreshQueue);
    window.addEventListener('storage', refreshQueue);

    const handleTabNavigate = (e: any) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab as PatientTab);
      }
    };
    window.addEventListener('mediconnect_navigate_tab', handleTabNavigate);

    return () => {
      window.removeEventListener('mediconnect_queue_change', refreshQueue);
      window.removeEventListener('storage', refreshQueue);
      window.removeEventListener('mediconnect_navigate_tab', handleTabNavigate);
    };
  }, [user.id]);

  const handleAcknowledgeAlert = () => {
    if (queueEntry) {
      acknowledgeAlert(queueEntry.id);
      setQueueEntry(getQueueForPatient(user.id));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Live Queue':
        return <MediSilentAlertSection user={user} />;
      case 'Appointments':
        return <Appointments user={user} appointments={appointments} setAppointments={setAppointments} onNavigateQueue={() => setActiveTab('Live Queue')} />;
      case 'Medical Records':
        return <MedicalRecords patientId={user.id} user={user} labTests={labTests} />;
      case 'Prescriptions':
        return <Prescriptions user={user} prescriptions={patientPrescriptions} doctors={MOCK_DOCTORS} />;
      case 'Billing':
        return <BillingHistory patientId={user.id} user={user} />;
      case 'Wellness':
        return <WellnessTracker patientId={user.id} />;
      case 'Symptom Checker':
        return <SymptomChecker />;
      case 'Dashboard':
      default:
        return (
          <PatientDashboardSummary
            user={user}
            setActiveTab={setActiveTab}
            appointments={appointments}
            prescriptions={patientPrescriptions}
            queueEntry={queueEntry}
            onOpenAlertModal={() => setIsAlertModalOpen(true)}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onNavigate={onNavigate}
          />
        );
    }
  };

  const tabs: PatientTab[] = ['Dashboard', 'Live Queue', 'Appointments', 'Medical Records', 'Prescriptions', 'Billing', 'Wellness', 'Symptom Checker'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patient Portal</h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user.name}!</p>

      <div className="mt-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="md:w-1/4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const isYourTurn = tab === 'Live Queue' && queueEntry?.status === 'Your Turn';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-between ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-sm'
                      : isYourTurn
                      ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-500 animate-pulse font-bold dark:bg-emerald-950/60 dark:text-emerald-200'
                      : 'text-gray-600 dark:text-dark-text hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-white'
                  }`}
                >
                  <span>
                    {tab === 'Live Queue' ? 'Live Queue & Alert' : tab}
                  </span>
                  {tab === 'Live Queue' && queueEntry && (
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      queueEntry.status === 'Your Turn'
                        ? 'bg-emerald-600 text-white animate-bounce'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {queueEntry.tokenNumber}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {onNavigate && (
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={() => onNavigate('WayFinder')}
                className="w-full text-left px-4 py-2.5 rounded-xl font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex items-center justify-between border border-blue-200 dark:border-blue-900"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span>🧭</span>
                  <span>Hospital WayFinder Maps</span>
                </span>
                <span className="text-xs">↗</span>
              </button>

              <button
                onClick={() => setIsFacilitiesModalOpen(true)}
                className="w-full mt-2 text-left px-4 py-2.5 rounded-xl font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center justify-between border border-emerald-200 dark:border-emerald-900"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span>♿</span>
                  <span>Verified Accessibility Facilities</span>
                </span>
                <span className="text-xs">🏛️</span>
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="md:w-3/4">
          <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md min-h-[400px]">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* MediSilentAlert Fullscreen Visual Modal */}
      {queueEntry && (
        <MediSilentAlertModal
          queueEntry={queueEntry}
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          onAcknowledged={handleAcknowledgeAlert}
          onOpenWayFinder={onNavigate ? () => onNavigate('WayFinder') : undefined}
        />
      )}

      {/* Verified Accessibility Facilities Modal */}
      {isFacilitiesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col border border-emerald-200 dark:border-emerald-900">
            <div className="flex justify-between items-center pb-4 border-b dark:border-dark-border">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-xl">
                  ♿
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verified Accessibility Facilities</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hospital Certified & ADA Standards Verified</p>
                </div>
              </div>
              <button
                onClick={() => setIsFacilitiesModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1">
              {VERIFIED_ACCESSIBILITY_FACILITIES.map(fac => (
                <div key={fac.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{fac.type === 'Ramp' ? '🛤️' : fac.type === 'Elevator' ? '🛗' : fac.type === 'Restroom' ? '🚻' : fac.type === 'Wheelchair Station' ? '♿' : '🦯'}</span>
                      <span>{fac.name}</span>
                    </h4>
                    <span className="text-[10px] uppercase font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Floor {fac.floor}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                    📍 {fac.location}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {fac.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span>✓</span> {fac.verifiedStatus}
                    </span>
                    {onNavigate && (
                      <button
                        onClick={() => {
                          setIsFacilitiesModalOpen(false);
                          onNavigate('WayFinder');
                        }}
                        className="text-primary hover:underline font-bold text-xs"
                      >
                        Find on Map →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t dark:border-dark-border flex justify-end">
              <button
                onClick={() => setIsFacilitiesModalOpen(false)}
                className="bg-primary text-white font-semibold py-2 px-5 rounded-xl hover:bg-primary/90 transition text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;

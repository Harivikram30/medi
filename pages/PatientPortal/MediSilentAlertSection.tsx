import React, { useState, useEffect, useCallback } from 'react';
import type { User, QueueEntry, SilentAlert } from '../../types';
import {
  getQueueForPatient,
  getSilentAlerts,
  updateQueueStatus,
  acknowledgeAlert,
  clearAlertHistory,
  getVibrationPreference,
  setVibrationPreference,
  triggerVibration,
  stopVibration
} from '../../services/queueService';
import MediSilentAlertModal from '../../components/MediSilentAlert/MediSilentAlertModal';

interface MediSilentAlertSectionProps {
  user: User;
}

const MediSilentAlertSection: React.FC<MediSilentAlertSectionProps> = ({ user }) => {
  const [queueEntry, setQueueEntry] = useState<QueueEntry | undefined>(() => getQueueForPatient(user.id));
  const [alerts, setAlerts] = useState<SilentAlert[]>(() => getSilentAlerts(user.id));
  const [vibrationEnabled, setVibrationEnabledState] = useState<boolean>(() => getVibrationPreference());
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [vibrationTestFeedback, setVibrationTestFeedback] = useState<string>('');

  const refreshData = useCallback(() => {
    setQueueEntry(getQueueForPatient(user.id));
    setAlerts(getSilentAlerts(user.id));
  }, [user.id]);

  useEffect(() => {
    refreshData();

    // Listen to real-time events from other components or tabs
    const handleQueueChange = () => refreshData();
    const handleAlertsChange = () => refreshData();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hms_queue_entries' || e.key === 'hms_silent_alerts') {
        refreshData();
      }
    };

    window.addEventListener('mediconnect_queue_change', handleQueueChange);
    window.addEventListener('mediconnect_alerts_change', handleAlertsChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('mediconnect_queue_change', handleQueueChange);
      window.removeEventListener('mediconnect_alerts_change', handleAlertsChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

  // If status is "Your Turn", automatically open modal if not already opened
  useEffect(() => {
    if (queueEntry?.status === 'Your Turn') {
      setIsAlertModalOpen(true);
    }
  }, [queueEntry?.status]);

  const handleToggleVibration = () => {
    const nextVal = !vibrationEnabled;
    setVibrationEnabledState(nextVal);
    setVibrationPreference(nextVal);
  };

  const handleTestVibration = () => {
    const didVibrate = triggerVibration([300, 150, 300, 150, 450]);
    if (didVibrate) {
      setVibrationTestFeedback('✓ Device vibration triggered!');
    } else {
      setVibrationTestFeedback('ℹ️ Vibration not supported on this device/browser (visual alerts will still be active).');
    }
    setTimeout(() => setVibrationTestFeedback(''), 4000);
  };

  const handleSimulateYourTurn = () => {
    if (!queueEntry) {
      // Create a demo queue entry if none exists
      const fallbackEntry: QueueEntry = {
        id: `q_user_${Date.now()}`,
        tokenNumber: 'TK-104',
        patientId: user.id,
        patientName: user.name,
        doctorId: 'd001',
        doctorName: 'Dr. Jane Smith',
        department: 'Cardiology',
        roomNumber: 'Room 204 (Cardiology Wing - 2nd Floor)',
        queuePosition: 1,
        estimatedWaitMinutes: 0,
        status: 'Waiting',
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setQueueEntry(fallbackEntry);
      updateQueueStatus(fallbackEntry.id, 'Your Turn');
    } else {
      updateQueueStatus(queueEntry.id, 'Your Turn');
    }
    setIsAlertModalOpen(true);
    refreshData();
  };

  const handleAdvanceStatus = (nextStatus: QueueEntry['status']) => {
    if (!queueEntry) return;
    updateQueueStatus(queueEntry.id, nextStatus);
    refreshData();
  };

  const handleResetQueue = () => {
    if (!queueEntry) return;
    updateQueueStatus(queueEntry.id, 'Waiting');
    stopVibration();
    refreshData();
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your MediSilentAlert history?')) {
      clearAlertHistory(user.id);
      refreshData();
    }
  };

  const getStatusColor = (status: QueueEntry['status']) => {
    switch (status) {
      case 'Your Turn':
        return 'bg-emerald-500 text-white animate-pulse shadow-md';
      case 'Calling':
        return 'bg-amber-500 text-white animate-pulse';
      case 'In Consultation':
        return 'bg-blue-600 text-white';
      case 'Waiting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'Completed':
        return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              MediSilentAlert™ & Live OPD Queue
            </h2>
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Active
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Real-time silent visual and haptic notifications when it's your turn for consultation.
          </p>
        </div>

        {/* Quick Trigger Button */}
        <button
          onClick={handleSimulateYourTurn}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm active:scale-95"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          Test "Your Turn" Alert
        </button>
      </div>

      {/* Active OPD Queue Status Card */}
      {queueEntry ? (
        <div className={`rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-lg border-2 ${
          queueEntry.status === 'Your Turn'
            ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-dark-card border-emerald-500 shadow-emerald-500/10'
            : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Token and Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">
                  Your OPD Token
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${getStatusColor(queueEntry.status)}`}>
                  {queueEntry.status === 'Your Turn' ? '🔔 Your Turn Now' : queueEntry.status}
                </span>
              </div>
              <div className="text-5xl font-black text-gray-900 dark:text-white tracking-wider">
                {queueEntry.tokenNumber}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Checked in at {queueEntry.checkInTime} • Position in queue: <strong>#{queueEntry.queuePosition}</strong> (Est. wait: {queueEntry.estimatedWaitMinutes} min)
              </p>
            </div>

            {/* Middle: Doctor & Room */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              {/* Verified Room Card */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="text-emerald-500 font-extrabold">✓</span> Verified Room
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  {queueEntry.roomNumber}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Door verified by OPD desk
                </div>
              </div>

              {/* Doctor Card */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                  Attending Doctor
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  {queueEntry.doctorName}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {queueEntry.department}
                </div>
              </div>
            </div>
          </div>

          {/* Alert Actions Bar */}
          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {queueEntry.status === 'Your Turn' && (
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow transition"
                >
                  <span>👀</span> View Fullscreen Alert
                </button>
              )}

              {queueEntry.status === 'Your Turn' && (
                <button
                  onClick={() => {
                    acknowledgeAlert(queueEntry.id);
                    refreshData();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
                >
                  ✓ Acknowledge (I'm on My Way)
                </button>
              )}
            </div>

            {/* Simulation controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">Queue Controls:</span>
              <button
                onClick={() => handleAdvanceStatus('Calling')}
                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold py-1.5 px-3 rounded-lg dark:bg-amber-900/30 dark:text-amber-300 transition"
              >
                Set Calling
              </button>
              <button
                onClick={() => handleAdvanceStatus('Your Turn')}
                className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold py-1.5 px-3 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-300 transition"
              >
                Set Your Turn
              </button>
              <button
                onClick={handleResetQueue}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1.5 px-3 rounded-lg dark:bg-gray-700 dark:text-gray-300 transition"
              >
                Reset to Waiting
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border">
          <p className="text-gray-600 dark:text-gray-300 text-base">You are not currently in an OPD active queue.</p>
          <button
            onClick={handleSimulateYourTurn}
            className="mt-4 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition text-sm"
          >
            Check In for OPD & Test MediSilentAlert
          </button>
        </div>
      )}

      {/* Vibration Alert Preference */}
      <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-md border border-gray-200 dark:border-dark-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📳</span>
              <h3 className="font-bold text-gray-900 dark:text-white">Optional Vibration Alert</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Quietly vibrates your phone or mobile device when your token is called, keeping waiting halls peaceful.
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleVibration}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              vibrationEnabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={vibrationEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {vibrationEnabled ? 'Status: Vibration Enabled' : 'Status: Vibration Disabled'}
          </span>
          <button
            onClick={handleTestVibration}
            className="text-xs font-bold text-primary dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Test Vibration</span>
          </button>
        </div>

        {vibrationTestFeedback && (
          <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400 font-medium">
            {vibrationTestFeedback}
          </p>
        )}
      </div>

      {/* Alert History Section */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-md border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📜</span> MediSilentAlert History
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Log of all turn calls, room assignments, and patient acknowledgements
            </p>
          </div>

          {alerts.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Clear History
            </button>
          )}
        </div>

        {alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-light dark:bg-dark-bg text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Time Called</th>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Doctor & Dept</th>
                  <th className="py-3 px-4">Verified Room</th>
                  <th className="py-3 px-4">Status & Ack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/60 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-xs">
                      {alert.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-400">
                      {alert.tokenNumber}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 dark:text-white">{alert.doctorName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{alert.department}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        📍 {alert.roomNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {alert.acknowledged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          ✓ Acknowledged {alert.acknowledgedAt && `(${alert.acknowledgedAt})`}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            acknowledgeAlert(alert.id);
                            refreshData();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No past alert history found.
          </div>
        )}
      </div>

      {/* MediSilentAlert Modal (Triggered when "Your Turn") */}
      {queueEntry && (
        <MediSilentAlertModal
          queueEntry={queueEntry}
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          onAcknowledged={() => refreshData()}
        />
      )}
    </div>
  );
};

export default MediSilentAlertSection;

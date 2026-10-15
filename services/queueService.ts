import type { QueueEntry, SilentAlert, QueueStatus } from '../types';
import { MOCK_QUEUE_ENTRIES, MOCK_SILENT_ALERTS } from '../constants';

const QUEUE_STORAGE_KEY = 'hms_queue_entries';
const ALERTS_STORAGE_KEY = 'hms_silent_alerts';
const VIBRATION_STORAGE_KEY = 'hms_vibration_enabled';

// Load Queue Entries from localStorage or mock
export const getQueueEntries = (): QueueEntry[] => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading queue entries from localStorage:', e);
  }
  return MOCK_QUEUE_ENTRIES;
};

export const saveQueueEntries = (entries: QueueEntry[]) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('mediconnect_queue_change', { detail: { entries } }));
  } catch (e) {
    console.error('Error saving queue entries:', e);
  }
};

export const getQueueForPatient = (patientId: string): QueueEntry | undefined => {
  const entries = getQueueEntries();
  return entries.find(q => q.patientId === patientId && q.status !== 'Completed' && q.status !== 'Cancelled');
};

// Load Silent Alerts History
export const getSilentAlerts = (patientId?: string): SilentAlert[] => {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    const alerts: SilentAlert[] = raw ? JSON.parse(raw) : MOCK_SILENT_ALERTS;
    if (patientId) {
      return alerts.filter(a => a.patientId === patientId);
    }
    return alerts;
  } catch (e) {
    console.error('Error loading silent alerts:', e);
    return patientId ? MOCK_SILENT_ALERTS.filter(a => a.patientId === patientId) : MOCK_SILENT_ALERTS;
  }
};

export const saveSilentAlerts = (alerts: SilentAlert[]) => {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    window.dispatchEvent(new CustomEvent('mediconnect_alerts_change', { detail: { alerts } }));
  } catch (e) {
    console.error('Error saving silent alerts:', e);
  }
};

// Vibration Preference & Execution
export const getVibrationPreference = (): boolean => {
  try {
    const raw = localStorage.getItem(VIBRATION_STORAGE_KEY);
    return raw !== null ? JSON.parse(raw) : true; // Enabled by default
  } catch (e) {
    return true;
  }
};

export const setVibrationPreference = (enabled: boolean) => {
  try {
    localStorage.setItem(VIBRATION_STORAGE_KEY, JSON.stringify(enabled));
  } catch (e) {
    console.error('Error setting vibration preference:', e);
  }
};

export const triggerVibration = (pattern: number | number[] = [300, 150, 300, 150, 450]): boolean => {
  if (!getVibrationPreference()) return false;
  if (typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      return navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Vibration API not permitted or supported:', e);
      return false;
    }
  }
  return false;
};

export const stopVibration = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(0);
    } catch (e) {}
  }
};

// Update Queue Status (e.g. to "Your Turn" or "Calling")
export const updateQueueStatus = (entryId: string, status: QueueStatus): QueueEntry | undefined => {
  const entries = getQueueEntries();
  const index = entries.findIndex(e => e.id === entryId);
  if (index === -1) return undefined;

  const current = entries[index];
  const updated: QueueEntry = {
    ...current,
    status,
    calledAt: status === 'Your Turn' || status === 'Calling' ? new Date().toISOString() : current.calledAt,
  };

  entries[index] = updated;
  saveQueueEntries(entries);

  // If status is changed to "Your Turn" or "Calling", generate an alert in alert history
  if (status === 'Your Turn' || status === 'Calling') {
    const alerts = getSilentAlerts();
    const newAlert: SilentAlert = {
      id: `alert_${Date.now()}`,
      tokenNumber: updated.tokenNumber,
      patientId: updated.patientId,
      patientName: updated.patientName,
      doctorId: updated.doctorId,
      doctorName: updated.doctorName,
      department: updated.department,
      roomNumber: updated.roomNumber,
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      acknowledged: false,
      status: 'Your Turn',
    };
    saveSilentAlerts([newAlert, ...alerts]);

    // Fire vibration if enabled
    triggerVibration();
  }

  return updated;
};

// Patient Acknowledgement
export const acknowledgeAlert = (tokenOrAlertId: string): void => {
  stopVibration();

  // Update alerts history
  const alerts = getSilentAlerts();
  const alertIndex = alerts.findIndex(a => a.id === tokenOrAlertId || a.tokenNumber === tokenOrAlertId);
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (alertIndex !== -1) {
    alerts[alertIndex] = {
      ...alerts[alertIndex],
      acknowledged: true,
      acknowledgedAt: nowStr,
    };
    saveSilentAlerts(alerts);
  }

  // Also update corresponding queue entry
  const entries = getQueueEntries();
  const qIndex = entries.findIndex(q => q.id === tokenOrAlertId || q.tokenNumber === tokenOrAlertId);
  if (qIndex !== -1) {
    entries[qIndex] = {
      ...entries[qIndex],
      acknowledgedAt: nowStr,
      status: 'In Consultation',
    };
    saveQueueEntries(entries);
  }
};

// Clear alert history for patient
export const clearAlertHistory = (patientId: string): void => {
  const alerts = getSilentAlerts();
  const filtered = alerts.filter(a => a.patientId !== patientId);
  saveSilentAlerts(filtered);
};

// Doctor Calling Patient (Triggers MediSilentAlert)
export const callPatientFromDoctor = (appointment: { patientId: string; patientName: string; doctorSpecialization?: string }, doctor: { id: string; name: string; department?: string }): QueueEntry => {
  const entries = getQueueEntries();
  let existing = entries.find(e => e.patientId === appointment.patientId && e.status !== 'Completed' && e.status !== 'Cancelled');
  const roomNumber = `Room ${doctor.id === 'd001' ? '204' : doctor.id === 'd002' ? '310' : doctor.id === 'd003' ? '108' : '105'} (${doctor.department || appointment.doctorSpecialization || 'OPD'} - 2nd Floor)`;

  if (existing) {
    existing = {
      ...existing,
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: doctor.department || existing.department,
      roomNumber,
      status: 'Your Turn',
      calledAt: new Date().toISOString(),
    };
    const idx = entries.findIndex(e => e.id === existing!.id);
    entries[idx] = existing;
  } else {
    existing = {
      id: `q_${Date.now()}`,
      tokenNumber: `TK-${Math.floor(100 + Math.random() * 900)}`,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: doctor.department || appointment.doctorSpecialization || 'OPD',
      roomNumber,
      queuePosition: 1,
      estimatedWaitMinutes: 0,
      status: 'Your Turn',
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      calledAt: new Date().toISOString(),
    };
    entries.unshift(existing);
  }

  saveQueueEntries(entries);

  // Trigger alert
  const alerts = getSilentAlerts();
  const newAlert: SilentAlert = {
    id: `alert_${Date.now()}`,
    tokenNumber: existing.tokenNumber,
    patientId: existing.patientId,
    patientName: existing.patientName,
    doctorId: existing.doctorId,
    doctorName: existing.doctorName,
    department: existing.department,
    roomNumber: existing.roomNumber,
    timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    acknowledged: false,
    status: 'Your Turn',
  };
  saveSilentAlerts([newAlert, ...alerts]);
  triggerVibration();

  return existing;
};

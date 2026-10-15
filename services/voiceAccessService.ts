import type { User, Appointment, LabTest, Page } from '../types';

export type TextSize = 'normal' | 'large' | 'xl';

export interface CommandExecutionResult {
  success: boolean;
  message: string;
  actionTaken?: 'navigate_page' | 'navigate_tab' | 'read_appointments' | 'open_lab_reports' | 'set_text_size' | 'help' | 'blocked_modification' | 'unauthorized';
  targetPage?: Page;
  targetTab?: string;
  spokenText: string;
}

// Global text size helper
export const applyTextSize = (size: TextSize) => {
  try {
    localStorage.setItem('mediconnect_text_size', size);
    const root = document.documentElement;
    if (size === 'normal') {
      root.style.fontSize = '16px';
      root.classList.remove('text-size-large', 'text-size-xl');
    } else if (size === 'large') {
      root.style.fontSize = '18.5px'; // ~115%
      root.classList.remove('text-size-xl');
      root.classList.add('text-size-large');
    } else if (size === 'xl') {
      root.style.fontSize = '21px'; // ~130%
      root.classList.remove('text-size-large');
      root.classList.add('text-size-xl');
    }
    window.dispatchEvent(new CustomEvent('mediconnect_text_size_change', { detail: { size } }));
  } catch (e) {
    console.error('Failed to apply text size:', e);
  }
};

export const getSavedTextSize = (): TextSize => {
  try {
    const saved = localStorage.getItem('mediconnect_text_size') as TextSize;
    if (saved === 'normal' || saved === 'large' || saved === 'xl') {
      return saved;
    }
  } catch (e) {
    console.error(e);
  }
  return 'normal';
};

// Text to Speech
export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

export const stopSpeaking = () => {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Speech cancellation error:', e);
    }
  }
};

export const speakText = (text: string, onEnd?: () => void): void => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported on this browser.');
    if (onEnd) onEnd();
    return;
  }

  try {
    // Cancel any active speech before starting new speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower for crisp clinical comprehension
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Attempt to pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Zira')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('TTS execution error:', err);
    if (onEnd) onEnd();
  }
};

// Check Speech Recognition support
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export interface VoiceCommandContext {
  currentUser: User | null;
  appointments: Appointment[];
  labTests: LabTest[];
  navigate: (page: Page) => void;
  navigatePatientTab?: (tab: string) => void;
  currentTextSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

// Parse and execute voice commands safely
export const processVoiceCommand = (
  rawTranscript: string,
  context: VoiceCommandContext
): CommandExecutionResult => {
  const query = rawTranscript.trim().toLowerCase();

  // 1. SAFETY & PRIVACY GUARDRAIL: NEVER MODIFY OR DELETE RECORDS THROUGH VOICE COMMANDS
  const destructiveKeywords = [
    'delete', 'remove', 'cancel', 'drop', 'erase', 'modify',
    'edit', 'update', 'change', 'book', 'schedule', 'reschedule',
    'pay', 'checkout', 'submit', 'write prescription', 'reset password'
  ];

  const hasDestructiveIntent = destructiveKeywords.some(keyword => {
    // check word boundary or phrase match
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(query);
  });

  if (hasDestructiveIntent) {
    const warningMessage = "Voice commands cannot create, modify, or delete medical records for patient privacy and clinical safety. Please perform record actions securely via the portal interface.";
    speakText(warningMessage);
    return {
      success: false,
      message: warningMessage,
      actionTaken: 'blocked_modification',
      spokenText: warningMessage,
    };
  }

  // 2. READ APPOINTMENTS
  if (
    query.includes('appointment') ||
    query.includes('schedule') ||
    query.includes('doctor visit') ||
    query.includes('consultation')
  ) {
    if (!context.currentUser || context.currentUser.role !== 'PATIENT') {
      const msg = "Please log in with a verified patient account to access and read your personal appointments.";
      speakText(msg);
      return {
        success: false,
        message: msg,
        actionTaken: 'unauthorized',
        spokenText: msg,
      };
    }

    // Filter upcoming appointments for current patient
    const userAppointments = context.appointments
      .filter(a => a.patientId === context.currentUser?.id && a.status === 'Upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Switch to Patient Portal and Appointments tab
    context.navigate('Patient Portal');
    if (context.navigatePatientTab) {
      context.navigatePatientTab('Appointments');
    }
    // Also dispatch tab change event
    window.dispatchEvent(new CustomEvent('mediconnect_navigate_tab', { detail: { tab: 'Appointments' } }));

    if (userAppointments.length === 0) {
      const speech = `Hello ${context.currentUser.name}, you currently have no upcoming appointments scheduled on your chart.`;
      speakText(speech);
      return {
        success: true,
        message: speech,
        actionTaken: 'read_appointments',
        spokenText: speech,
      };
    }

    const appointmentSummaries = userAppointments.map((app, idx) => {
      const dateFormatted = new Date(app.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      return `Appointment ${idx + 1}: ${app.doctorSpecialization} consultation with ${app.doctorName} on ${dateFormatted} at ${app.time}.`;
    });

    const speech = `You have ${userAppointments.length} upcoming appointment${userAppointments.length > 1 ? 's' : ''}. ${appointmentSummaries.join(' ')}`;
    speakText(speech);

    return {
      success: true,
      message: speech,
      actionTaken: 'read_appointments',
      spokenText: speech,
    };
  }

  // 3. OPEN LABORATORY REPORTS
  if (
    query.includes('lab') ||
    query.includes('laboratory') ||
    query.includes('blood test') ||
    query.includes('test result') ||
    query.includes('pathology') ||
    query.includes('biochemistry')
  ) {
    if (!context.currentUser || context.currentUser.role !== 'PATIENT') {
      const msg = "Please log in with a verified patient account to open and read laboratory test reports.";
      speakText(msg);
      return {
        success: false,
        message: msg,
        actionTaken: 'unauthorized',
        spokenText: msg,
      };
    }

    // Navigate to Patient Portal -> Medical Records
    context.navigate('Patient Portal');
    if (context.navigatePatientTab) {
      context.navigatePatientTab('Medical Records');
    }
    window.dispatchEvent(new CustomEvent('mediconnect_navigate_tab', { detail: { tab: 'Medical Records' } }));

    // Find lab tests for patient
    const patientLabs = context.labTests.filter(t => t.patientName.toLowerCase() === context.currentUser?.name.toLowerCase());
    
    if (patientLabs.length === 0) {
      const speech = `Opening your medical records. No active laboratory reports are currently listed for ${context.currentUser.name}.`;
      speakText(speech);
      return {
        success: true,
        message: speech,
        actionTaken: 'open_lab_reports',
        spokenText: speech,
      };
    }

    const latestLab = patientLabs[0];
    const speech = `Opening your laboratory reports. Your latest report is for ${latestLab.testType}, ordered by ${latestLab.requestedBy}. Status: ${latestLab.status}. ${latestLab.results ? `Findings summary: ${latestLab.results}` : 'Results are being verified by lab staff.'}`;
    speakText(speech);

    return {
      success: true,
      message: speech,
      actionTaken: 'open_lab_reports',
      spokenText: speech,
    };
  }

  // 4. ADJUST TEXT SIZE
  if (
    query.includes('text size') ||
    query.includes('font size') ||
    query.includes('zoom') ||
    query.includes('make text') ||
    query.includes('larger text') ||
    query.includes('smaller text') ||
    query.includes('big text') ||
    query.includes('large text')
  ) {
    if (query.includes('increase') || query.includes('larger') || query.includes('big') || query.includes('more')) {
      const nextSize: TextSize = context.currentTextSize === 'normal' ? 'large' : 'xl';
      context.setTextSize(nextSize);
      applyTextSize(nextSize);
      const speech = `Text size increased to ${nextSize === 'xl' ? 'extra large' : 'large'}.`;
      speakText(speech);
      return {
        success: true,
        message: speech,
        actionTaken: 'set_text_size',
        spokenText: speech,
      };
    }

    if (query.includes('decrease') || query.includes('smaller') || query.includes('small') || query.includes('less')) {
      const nextSize: TextSize = context.currentTextSize === 'xl' ? 'large' : 'normal';
      context.setTextSize(nextSize);
      applyTextSize(nextSize);
      const speech = `Text size decreased to ${nextSize}.`;
      speakText(speech);
      return {
        success: true,
        message: speech,
        actionTaken: 'set_text_size',
        spokenText: speech,
      };
    }

    if (query.includes('reset') || query.includes('normal') || query.includes('default')) {
      context.setTextSize('normal');
      applyTextSize('normal');
      const speech = "Text size reset to standard default.";
      speakText(speech);
      return {
        success: true,
        message: speech,
        actionTaken: 'set_text_size',
        spokenText: speech,
      };
    }
  }

  // 5. RESTRICTED ROLE PORTALS - RESPECT PERMISSIONS
  if (query.includes('doctor portal') || query.includes('doctor dashboard')) {
    if (context.currentUser?.role !== 'DOCTOR') {
      const msg = "Access denied. Doctor Portal is restricted to licensed medical practitioners.";
      speakText(msg);
      return {
        success: false,
        message: msg,
        actionTaken: 'unauthorized',
        spokenText: msg,
      };
    }
    context.navigate('Doctor Portal');
    speakText("Navigating to Doctor Portal.");
    return {
      success: true,
      message: "Navigating to Doctor Portal.",
      actionTaken: 'navigate_page',
      targetPage: 'Doctor Portal',
      spokenText: "Navigating to Doctor Portal.",
    };
  }

  if (query.includes('admin') || query.includes('administration') || query.includes('admin dashboard')) {
    if (context.currentUser?.role !== 'ADMIN') {
      const msg = "Access denied. Administrative dashboard requires hospital system administrator privileges.";
      speakText(msg);
      return {
        success: false,
        message: msg,
        actionTaken: 'unauthorized',
        spokenText: msg,
      };
    }
    context.navigate('Admin Dashboard');
    speakText("Navigating to Hospital Admin Dashboard.");
    return {
      success: true,
      message: "Navigating to Hospital Admin Dashboard.",
      actionTaken: 'navigate_page',
      targetPage: 'Admin Dashboard',
      spokenText: "Navigating to Hospital Admin Dashboard.",
    };
  }

  if (query.includes('nurse portal') || query.includes('nursing station')) {
    if (context.currentUser?.role !== 'NURSE') {
      const msg = "Access denied. Nurse Portal is restricted to verified nursing staff.";
      speakText(msg);
      return {
        success: false,
        message: msg,
        actionTaken: 'unauthorized',
        spokenText: msg,
      };
    }
    context.navigate('Nurse Portal');
    speakText("Navigating to Nurse Portal.");
    return {
      success: true,
      message: "Navigating to Nurse Portal.",
      actionTaken: 'navigate_page',
      targetPage: 'Nurse Portal',
      spokenText: "Navigating to Nurse Portal.",
    };
  }

  // 6. PATIENT PORTAL & INTERNAL TABS
  if (query.includes('patient portal') || query.includes('my portal') || query.includes('dashboard')) {
    if (!context.currentUser || context.currentUser.role !== 'PATIENT') {
      const msg = "Please log in with a verified patient account to access the Patient Portal.";
      speakText(msg);
      return {
        success: false,
        message: msg,
        actionTaken: 'unauthorized',
        spokenText: msg,
      };
    }
    context.navigate('Patient Portal');
    if (context.navigatePatientTab) context.navigatePatientTab('Dashboard');
    window.dispatchEvent(new CustomEvent('mediconnect_navigate_tab', { detail: { tab: 'Dashboard' } }));
    const speech = `Welcome to your patient portal, ${context.currentUser.name}.`;
    speakText(speech);
    return {
      success: true,
      message: speech,
      actionTaken: 'navigate_page',
      targetPage: 'Patient Portal',
      spokenText: speech,
    };
  }

  if (query.includes('prescription') || query.includes('medication') || query.includes('drugs') || query.includes('pharmacy list')) {
    if (!context.currentUser || context.currentUser.role !== 'PATIENT') {
      const msg = "Please log in as a patient to view your active prescriptions.";
      speakText(msg);
      return { success: false, message: msg, actionTaken: 'unauthorized', spokenText: msg };
    }
    context.navigate('Patient Portal');
    if (context.navigatePatientTab) context.navigatePatientTab('Prescriptions');
    window.dispatchEvent(new CustomEvent('mediconnect_navigate_tab', { detail: { tab: 'Prescriptions' } }));
    const speech = "Navigating to your active prescriptions and medications.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_tab', targetTab: 'Prescriptions', spokenText: speech };
  }

  if (query.includes('billing') || query.includes('bill') || query.includes('invoice') || query.includes('payment receipt')) {
    if (!context.currentUser || context.currentUser.role !== 'PATIENT') {
      const msg = "Please log in as a patient to view billing statements.";
      speakText(msg);
      return { success: false, message: msg, actionTaken: 'unauthorized', spokenText: msg };
    }
    context.navigate('Patient Portal');
    if (context.navigatePatientTab) context.navigatePatientTab('Billing');
    window.dispatchEvent(new CustomEvent('mediconnect_navigate_tab', { detail: { tab: 'Billing' } }));
    const speech = "Navigating to your hospital billing history and invoices.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_tab', targetTab: 'Billing', spokenText: speech };
  }

  if (query.includes('queue') || query.includes('token') || query.includes('silent alert') || query.includes('waiting status')) {
    if (!context.currentUser || context.currentUser.role !== 'PATIENT') {
      const msg = "Please log in as a patient to view your OPD queue token.";
      speakText(msg);
      return { success: false, message: msg, actionTaken: 'unauthorized', spokenText: msg };
    }
    context.navigate('Patient Portal');
    if (context.navigatePatientTab) context.navigatePatientTab('Live Queue');
    window.dispatchEvent(new CustomEvent('mediconnect_navigate_tab', { detail: { tab: 'Live Queue' } }));
    const speech = "Opening live OPD queue tracker and MediSilentAlert.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_tab', targetTab: 'Live Queue', spokenText: speech };
  }

  if (query.includes('symptom') || query.includes('check symptoms') || query.includes('ai checker')) {
    if (!context.currentUser || context.currentUser.role !== 'PATIENT') {
      const msg = "Please log in as a patient to use the AI Clinical Symptom Checker.";
      speakText(msg);
      return { success: false, message: msg, actionTaken: 'unauthorized', spokenText: msg };
    }
    context.navigate('Patient Portal');
    if (context.navigatePatientTab) context.navigatePatientTab('Symptom Checker');
    window.dispatchEvent(new CustomEvent('mediconnect_navigate_tab', { detail: { tab: 'Symptom Checker' } }));
    const speech = "Opening MediConnect Symptom Checker.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_tab', targetTab: 'Symptom Checker', spokenText: speech };
  }

  if (query.includes('wellness') || query.includes('vital') || query.includes('health track')) {
    if (!context.currentUser || context.currentUser.role !== 'PATIENT') {
      const msg = "Please log in as a patient to access your wellness log.";
      speakText(msg);
      return { success: false, message: msg, actionTaken: 'unauthorized', spokenText: msg };
    }
    context.navigate('Patient Portal');
    if (context.navigatePatientTab) context.navigatePatientTab('Wellness');
    window.dispatchEvent(new CustomEvent('mediconnect_navigate_tab', { detail: { tab: 'Wellness' } }));
    const speech = "Opening your personal Wellness Tracker.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_tab', targetTab: 'Wellness', spokenText: speech };
  }

  // 7. PUBLIC PAGES NAVIGATION
  if (query.includes('wayfinder') || query.includes('map') || query.includes('directions') || query.includes('floor')) {
    context.navigate('WayFinder');
    const speech = "Navigating to MediConnect WayFinder interactive hospital floor maps.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_page', targetPage: 'WayFinder', spokenText: speech };
  }

  if (query.includes('service') || query.includes('department') || query.includes('specialties')) {
    context.navigate('Services');
    const speech = "Navigating to Hospital Clinical Services.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_page', targetPage: 'Services', spokenText: speech };
  }

  if (query.includes('about') || query.includes('who we are') || query.includes('hospital info')) {
    context.navigate('About Us');
    const speech = "Navigating to About MediConnect HMS.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_page', targetPage: 'About Us', spokenText: speech };
  }

  if (query.includes('contact') || query.includes('emergency phone') || query.includes('reach hospital')) {
    context.navigate('Contact');
    const speech = "Navigating to Hospital Contact and Emergency Support page.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_page', targetPage: 'Contact', spokenText: speech };
  }

  if (query.includes('home') || query.includes('main page') || query.includes('welcome page')) {
    context.navigate('Home');
    const speech = "Navigating to MediConnect Home page.";
    speakText(speech);
    return { success: true, message: speech, actionTaken: 'navigate_page', targetPage: 'Home', spokenText: speech };
  }

  // 8. HELP & COMMAND GUIDE
  if (query.includes('help') || query.includes('what can i say') || query.includes('commands')) {
    const speech = "You can speak commands like: 'Read my appointments', 'Open laboratory reports', 'Go to WayFinder', 'Go to Prescriptions', 'Increase text size', or 'Reset text size'. Voice commands strictly protect your privacy and will never modify or delete records.";
    speakText(speech);
    return {
      success: true,
      message: speech,
      actionTaken: 'help',
      spokenText: speech,
    };
  }

  // Fallback unrecognized command
  const fallbackSpeech = `Command "${rawTranscript}" not recognized. Say "Help" to hear the list of voice navigation commands.`;
  speakText(fallbackSpeech);
  return {
    success: false,
    message: fallbackSpeech,
    spokenText: fallbackSpeech,
  };
};

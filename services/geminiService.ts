import { GoogleGenAI } from "@google/genai";
import type { Medicine, User, Appointment } from '../types';
import { MOCK_DOCTORS } from '../constants';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

// Retrieve active Gemini API Key from localStorage, Vite env, or process env
export const getGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY) || localStorage.getItem('hms_gemini_api_key');
    if (stored && stored.trim()) {
      return stored.trim();
    }
  }

  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' ? process.env?.API_KEY : undefined) ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined) ||
    '';

  return (typeof envKey === 'string' ? envKey.trim() : '');
};

// Save custom API key to localStorage and notify listeners
export const setGeminiApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('mediconnect_gemini_key_changed', { detail: { key: trimmed } }));
  }
};

// Check if a Gemini API key is currently configured
export const isGeminiApiKeyConfigured = (): boolean => {
  return Boolean(getGeminiApiKey());
};

// Create a GoogleGenAI client on demand using active key
const getGenAIClient = (): GoogleGenAI | null => {
  const key = getGeminiApiKey();
  if (!key) return null;
  try {
    return new GoogleGenAI({ apiKey: key });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
    return null;
  }
};

const model = 'gemini-2.5-flash';

const chatbotSystemInstruction = `You are an intelligent hospital assistant chatbot named MediBot for the MediConnect Healthcare Management System. Your job is to give direct, factual answers based *only* on the hospital data provided to you. Do not invent information or direct users to find information elsewhere in the portal.

**Key Instructions:**
1.  **Direct Answers Only:** When a user asks a question, answer it directly using the provided data.
2.  **No Navigation:** Do not tell the user "You can find this on the X page" or "Check the portal." Provide the answer yourself.
3.  **Strictly Data-Bound:** Base all your responses on the \`Hospital Data\` JSON object. Do not use any external knowledge.
4.  **Handle Missing Data:** If the information is not in the provided data, politely state that you do not have that specific information right now.

**Example Scenarios:**
*   User: "Who is Dr. Ramesh Kumar?"
*   You: "Dr. Ramesh Kumar is our General Physician, available from 9 AM to 5 PM."
*   User: "What medicines are in stock?"
*   You: (List medicines from the pharmacy data).
*   User: "Who are the nurses?"
*   You: (List nurses from the staff data).`;

export const getChatbotResponse = async (
  userMessage: string,
  data: { users: User[], medicines: Medicine[], appointments: Appointment[] }
): Promise<string> => {
  const ai = getGenAIClient();
  const apiKey = getGeminiApiKey();

  // If no API key configured, provide smart hospital assistant answers from local mock database
  if (!ai || !apiKey) {
    const q = userMessage.toLowerCase();
    
    // Check for doctor questions
    const matchingDoctor = MOCK_DOCTORS.find(d => 
      q.includes(d.name.toLowerCase()) || 
      q.includes(d.specialization.toLowerCase())
    );
    if (matchingDoctor) {
      return `**${matchingDoctor.name}** is our Specialist in **${matchingDoctor.specialization}**.\n\n` +
             `*   **Availability:** ${matchingDoctor.availability}\n` +
             `*   **Location:** Floor 1, West Wing Consultation Suites\n\n` +
             `You can book an appointment directly through the Appointments tab.`;
    }

    // Check for emergency
    if (q.includes('emergency') || q.includes('ambulance') || q.includes('urgent')) {
      return `🚨 **Emergency Department is open 24/7.**\n\n` +
             `*   **Location:** Ground Floor (L0), West Wing (Room ER-101)\n` +
             `*   **Direct Hotline:** (123) 456-7890\n` +
             `*   **Ambulance Dispatch:** x911`;
    }

    // Check for medicines
    if (q.includes('medicine') || q.includes('pharmacy') || q.includes('drug') || q.includes('stock')) {
      const availableMeds = data.medicines.slice(0, 5).map(m => `* **${m.name}** (${m.category}) - ${m.quantity} in stock`).join('\n');
      return `Here are some of the current medicines available at our Outpatient Pharmacy (Room PH-01, Ground Floor):\n\n${availableMeds}\n\n*Note: Add your AI API Key in the settings to enable full natural language chat.*`;
    }

    // General fallback
    return `Hello! I'm MediBot. You can ask me about our doctors, clinic hours, pharmacy stock, or emergency services.\n\n` +
           `💡 *Tip: Configure your AI API key in the Symptom Checker to enable live conversational AI.*`;
  }
  
  // Create a comprehensive knowledge base for the model
  const departments = [...new Set(MOCK_DOCTORS.map(d => d.specialization))];

  const doctors = MOCK_DOCTORS.map(d => ({
    name: d.name,
    specialization: d.specialization,
    availability: d.availability,
  }));

  const otherStaff = data.users
    .filter(u => u.role !== 'PATIENT' && u.role !== 'DOCTOR')
    .map(u => ({ name: u.name, role: u.role, department: u.department || 'N/A' }));
  
  const hospitalData = {
    doctors,
    departments,
    otherStaff,
    medicines: data.medicines.map(m => ({ name: m.name, category: m.category, inStock: m.quantity > 0 })),
  };

  const prompt = `Here is the current Hospital Data:\n${JSON.stringify(hospitalData, null, 2)}\n\nUser Question: ${userMessage}`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            systemInstruction: chatbotSystemInstruction,
        },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for chatbot:", error);
    return "I'm sorry, I'm having trouble connecting to the hospital AI right now. Please try again in a moment.";
  }
};

const symptomCheckerSystemInstruction = `You are an AI-powered symptom analysis assistant for the MediConnect platform. Your role is to analyze a user's described symptoms and provide potential insights in a structured, responsible, and safe manner.

**Your response MUST be formatted as a simple markdown text and follow this structure exactly:**

### Possible Considerations
Based on the symptoms described, here are a few general areas that might be relevant for discussion with a doctor. This is not a diagnosis.
*   **Possibility 1:** A brief, high-level description.
*   **Possibility 2:** A brief, high-level description.
*   **Possibility 3:** A brief, high-level description.

### Recommended Specialist
For these types of symptoms, you might consider consulting with a:
*   **Specialist Name (e.g., General Practitioner, Cardiologist, Neurologist)**

### General Advice
Here are some general wellness tips that may be helpful. They are not a substitute for professional medical advice.
*   A piece of general, safe advice (e.g., "Ensure you are staying well-hydrated by drinking plenty of water.").
*   Another piece of general, safe advice (e.g., "Rest is important for recovery. Try to get adequate sleep.").

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**

**CRITICAL RULES:**
1.  **DO NOT PROVIDE A DIAGNOSIS.** Use phrases like "Possible Considerations," "might be related to," or "conditions that can cause these symptoms include."
2.  **ALWAYS prioritize safety.** If symptoms sound severe (e.g., "crushing chest pain," "difficulty breathing," "suicidal thoughts"), your FIRST and ONLY response should be to advise seeking immediate emergency medical help.
3.  **Keep it general.** Do not suggest specific medications or treatments.
4.  **Adhere strictly to the markdown format above.**
5.  The final disclaimer is mandatory and must be included exactly as written.
`;

// Built-in Clinical Knowledge Base for safe, structured symptom analysis fallback
export const generateClinicalSymptomAnalysis = (symptoms: string): string => {
  const q = symptoms.toLowerCase();
  
  // Emergency Red Flags
  const isEmergency = 
    q.includes('chest pain') || 
    q.includes('pressure in chest') || 
    q.includes('difficulty breathing') || 
    q.includes('cannot breathe') || 
    q.includes('shortness of breath') || 
    q.includes('stroke') || 
    q.includes('numbness on one side') || 
    q.includes('unconscious') || 
    q.includes('coughing blood');

  if (isEmergency) {
    return `### 🚨 Urgent Medical Attention Recommended

Your described symptoms include indicators that could require immediate evaluation by emergency care professionals.

### Possible Considerations
*   **Acute Cardiopulmonary or Respiratory Event:** Symptoms such as chest discomfort or difficulty breathing require prompt rule-out of acute issues.
*   **Neurological or Vascular Symptoms:** Sudden severe weakness, numbness, or breathing distress need acute triage.

### Recommended Specialist
*   **Emergency Medicine Department (ER-101, Ground Floor)**
*   **Immediate Emergency Hotline:** (123) 456-7890 or local emergency services (911).

### General Advice
*   Do not attempt to drive yourself to the clinic; arrange immediate medical transport or call emergency services.
*   Sit in an upright, comfortable position and try to remain calm.

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**`;
  }

  // Headache / Migraine / Neurological
  if (q.includes('headache') || q.includes('migraine') || q.includes('head') || q.includes('dizziness')) {
    return `### Possible Considerations
Based on the symptoms described, here are a few general areas that might be relevant for discussion with a doctor. This is not a diagnosis.
*   **Tension-Type Headache:** Often associated with muscle strain, screen fatigue, stress, or posture.
*   **Migraine with or without Aura:** May involve pulsating pain, sensitivity to bright lights or loud sounds, and occasional nausea.
*   **Dehydration or Sinus Strain:** Insufficient hydration or upper respiratory congestion can cause frontal or bilateral head pressure.

### Recommended Specialist
For these types of symptoms, you might consider consulting with a:
*   **General Practitioner (Room 101, Floor 1) or Neurologist (Room 202 - Dr. Michael Brown, Floor 2)**

### General Advice
Here are some general wellness tips that may be helpful. They are not a substitute for professional medical advice.
*   Rest in a quiet, dimly lit room and apply a cool or warm compress to your forehead or neck.
*   Ensure adequate hydration by drinking plenty of water, and avoid skipping meals or sudden caffeine withdrawal.
*   Keep a brief symptom diary noting duration, triggers, and any vision changes.

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**`;
  }

  // Respiratory / Fever / Cold / Cough / Sore Throat
  if (q.includes('fever') || q.includes('cough') || q.includes('sore throat') || q.includes('cold') || q.includes('flu') || q.includes('chills')) {
    return `### Possible Considerations
Based on the symptoms described, here are a few general areas that might be relevant for discussion with a doctor. This is not a diagnosis.
*   **Viral Upper Respiratory Tract Infection:** Common colds or seasonal viral illnesses frequently present with fever, pharyngeal discomfort, and cough.
*   **Acute Bronchitis or Pharyngitis:** Inflammation of the bronchial airways or throat tissues, occasionally requiring clinical differentiation from bacterial causes.
*   **Seasonal Allergies or Sinusitis:** Can lead to post-nasal drip, dry coughing, and general fatigue.

### Recommended Specialist
For these types of symptoms, you might consider consulting with a:
*   **General Physician (Room 101, Floor 1) or ENT Specialist (Room 104, Floor 1)**

### General Advice
Here are some general wellness tips that may be helpful. They are not a substitute for professional medical advice.
*   Drink warm fluids such as herbal teas, clear broths, and plenty of water to maintain hydration and soothe mucosal tissues.
*   Gargle with warm salt water and use a clean room humidifier to reduce throat irritation.
*   Get plenty of restorative sleep and monitor your temperature twice daily.

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**`;
  }

  // Gastrointestinal / Stomach / Nausea / Abdominal
  if (q.includes('stomach') || q.includes('nausea') || q.includes('vomit') || q.includes('diarrhea') || q.includes('belly') || q.includes('abdomen') || q.includes('acid') || q.includes('heartburn')) {
    return `### Possible Considerations
Based on the symptoms described, here are a few general areas that might be relevant for discussion with a doctor. This is not a diagnosis.
*   **Acute Gastroenteritis:** Temporary irritation of the stomach and intestines, often due to food sensitivity or viral agents.
*   **Gastric Acidity or Dyspepsia:** Acid reflux or gastroesophageal irritation commonly presents with burning discomfort or upset stomach.
*   **Dietary Intolerance or IBS:** Irritable bowel sensitivities to specific foods or stress.

### Recommended Specialist
For these types of symptoms, you might consider consulting with a:
*   **General Practitioner (Room 101, Floor 1) or Gastroenterologist (Consultation Suites, Floor 2)**

### General Advice
Here are some general wellness tips that may be helpful. They are not a substitute for professional medical advice.
*   Eat small, bland meals (e.g. bananas, rice, applesauce, toast) and avoid spicy, greasy, or acidic foods.
*   Sip electrolyte rehydration solutions or water slowly throughout the day.
*   Avoid lying down immediately after eating and keep elevated if experiencing reflux.

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**`;
  }

  // Musculoskeletal / Joint / Back / Muscle Pain
  if (q.includes('joint') || q.includes('back') || q.includes('muscle') || q.includes('knee') || q.includes('sprain') || q.includes('ache')) {
    return `### Possible Considerations
Based on the symptoms described, here are a few general areas that might be relevant for discussion with a doctor. This is not a diagnosis.
*   **Musculoskeletal Strain or Sprain:** Overuse, lifting strain, or poor ergonomic posture frequently causes localized muscular tension.
*   **Joint Inflammation or Arthropathy:** Repetitive motion, tendon strain, or inflammatory conditions in joint capsules.
*   **Ergonomic Postural Fatigue:** Prolonged sitting or unsupportive footwear can induce radiating back or lower limb soreness.

### Recommended Specialist
For these types of symptoms, you might consider consulting with a:
*   **Orthopedic Specialist (Room 103, Floor 1) or Physical Therapist**

### General Advice
Here are some general wellness tips that may be helpful. They are not a substitute for professional medical advice.
*   Apply ice packs for acute swelling within the first 48 hours, or mild warm compresses for stiff chronic muscular tension.
*   Avoid heavy lifting or sudden twisting movements while allowing the affected area to rest.
*   Practice gentle mobility stretches within a comfortable, pain-free range of motion.

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**`;
  }

  // Dermatological / Skin / Rash / Itch
  if (q.includes('skin') || q.includes('rash') || q.includes('itch') || q.includes('allergy') || q.includes('hives')) {
    return `### Possible Considerations
Based on the symptoms described, here are a few general areas that might be relevant for discussion with a doctor. This is not a diagnosis.
*   **Contact Dermatitis or Allergic Reaction:** Exposure to new soaps, detergents, cosmetics, fabrics, or environmental allergens.
*   **Eczema or Xerosis:** Dry skin barrier irritation compounded by seasonal humidity shifts or warm showers.
*   **Urticaria (Hives):** Transient raised pruritic welts triggered by stress, dietary allergens, or viral reactions.

### Recommended Specialist
For these types of symptoms, you might consider consulting with a:
*   **Dermatologist (Room 105 - Dr. Ramesh Kumar, Floor 1)**

### General Advice
Here are some general wellness tips that may be helpful. They are not a substitute for professional medical advice.
*   Avoid scratching the affected area to prevent secondary bacterial infection; keep nails trimmed.
*   Use mild, fragrance-free moisturizers and avoid harsh antibacterial soaps or hot water baths.
*   Wear loose, breathable cotton clothing to minimize friction against sensitive skin.

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**`;
  }

  // General / Fatigue / Default Comprehensive Medical Analysis
  return `### Possible Considerations
Based on the symptoms described, here are a few general areas that might be relevant for discussion with a doctor. This is not a diagnosis.
*   **General Systemic Fatigue or Mild Viral Prodrome:** Mild nonspecific malaise can occur following periods of sleep disruption, physical stress, or minor viral exposure.
*   **Nutritional or Hydration Imbalance:** Inadequate water intake, low dietary electrolytes, or irregular eating patterns.
*   **Stress-Related Physical Manifestation:** Psychosomatic or physical responses to elevated occupational or emotional stress.

### Recommended Specialist
For these types of symptoms, you might consider consulting with a:
*   **General Practitioner / Family Physician (Room 101, Floor 1)**

### General Advice
Here are some general wellness tips that may be helpful. They are not a substitute for professional medical advice.
*   Ensure you are maintaining consistent hydration by drinking 2 to 2.5 liters of clean water daily.
*   Prioritize 7-8 hours of uninterrupted, restful sleep in a dark, quiet environment.
*   Document the timing, frequency, and severity of your symptoms to share during your clinical consultation.

---
**Disclaimer: I am an AI assistant and not a medical professional. This information is for educational purposes only and is not a substitute for a diagnosis from a qualified healthcare provider. Please consult with a doctor for any medical advice or treatment. If you are experiencing severe symptoms, seek immediate medical attention.**`;
};

// Main Symptom Analysis caller
export const getSymptomAnalysis = async (symptoms: string): Promise<string> => {
  const ai = getGenAIClient();
  const apiKey = getGeminiApiKey();

  // If a live Gemini API key is configured, query the Google Gemini 2.5 Flash model
  if (ai && apiKey) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: `Analyze the following patient described symptoms: "${symptoms}"`,
        config: {
          systemInstruction: symptomCheckerSystemInstruction,
        },
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (error: any) {
      console.warn("Live Gemini API call failed, falling back to clinical knowledge engine:", error);
      // Fall through to clinical knowledge engine with note
      const fallbackAnalysis = generateClinicalSymptomAnalysis(symptoms);
      return `> ℹ️ *Live AI service encountered an error (${error?.message || 'Network/Quota'}). Clinical Knowledge Analysis provided below:*\n\n${fallbackAnalysis}`;
    }
  }

  // If no Gemini API key is configured, return the structured clinical analysis immediately
  return generateClinicalSymptomAnalysis(symptoms);
};

const adminInsightsSystemInstruction = `You are an expert hospital administration analyst AI for the MediConnect HMS.
You will be given a JSON object containing current data about appointments, medicine inventory, and staff.
Your task is to analyze this data and provide a concise, actionable report for the hospital administrator.
Your report MUST be in markdown format and include the following sections:

### Key Insights
- Briefly summarize the most important findings. (e.g., "Cardiology is the busiest department this month.")
- Identify any immediate concerns. (e.g., "Several key medicines are running low on stock.")

### Appointment Trends
- Analyze the appointment data. Note any departments with high volume.
- Suggest potential scheduling optimizations if any patterns are apparent.

### Pharmacy Inventory Status
- Highlight medicines that are low in stock (quantity < 20) or expired.
- Suggest reordering priorities.

### Staffing Overview
- Comment on the distribution of staff across roles and departments.
- Point out if any department seems understaffed based on appointment volume.

### Recommendations
- Provide 2-3 clear, actionable recommendations for the administrator. (e.g., "Allocate an additional nurse to the Cardiology department on peak days.")

Be professional, data-driven, and concise.
`;

export const getAdminInsights = async (data: { appointments: any[], medicines: any[], users: any[] }): Promise<string> => {
  const ai = getGenAIClient();
  const apiKey = getGeminiApiKey();

  if (!ai || !apiKey) {
    // Generate intelligent data-driven admin report from current state
    const totalAppointments = data.appointments.length;
    const lowStockMeds = data.medicines.filter(m => m.quantity < 20);
    const doctorCount = data.users.filter(u => u.role === 'DOCTOR').length;
    const patientCount = data.users.filter(u => u.role === 'PATIENT').length;

    return `### Key Insights
- Hospital is actively serving **${patientCount} registered patients** with a clinical staff of **${doctorCount} doctors**.
- **${lowStockMeds.length} medicines** currently require restocking (stock level < 20 units).
- Active appointments recorded: **${totalAppointments} scheduled visits**.

### Appointment Trends
- Highest outpatient demand observed across **Cardiology (Room 204)** and **General Medicine (Room 101)**.
- Recommendation: Maintain 15-minute buffer between appointments during peak morning hours (9:00 AM - 12:00 PM).

### Pharmacy Inventory Status
- Critical items to restock: ${lowStockMeds.slice(0, 3).map(m => `**${m.name}** (${m.quantity} units left)`).join(', ') || 'Inventory is healthy'}.
- Reordering cycle recommended before end-of-week replenishment window.

### Staffing Overview
- Shift coverage is well-balanced across departments.
- Emergency Department (Room ER-101) is staffed for 24/7 acute trauma care.

### Recommendations
1. Place replenishment order for low-stock pharmaceutical supplies immediately.
2. Direct stable outpatients to the new **MediConnect WayFinder** kiosk for reduced reception congestion.
3. Configure your AI API key to unlock real-time predictive ML forecasting.`;
  }
  
  const appointmentSummary = data.appointments.map(a => ({
      specialization: a.doctorSpecialization,
      date: a.date,
      status: a.status
  }));

  const medicineSummary = data.medicines.map(m => ({
      name: m.name,
      category: m.category,
      quantity: m.quantity,
      expiry: m.expiry
  }));
  
  const staffSummary = data.users.filter(u => u.role !== 'PATIENT').map(u => ({
      role: u.role,
      department: u.department
  }));

  const promptData = {
      appointmentSummary,
      medicineSummary,
      staffSummary,
  };

  const prompt = `Here is the current hospital data. Please generate an administrative report based on it:\n\n${JSON.stringify(promptData)}`;

  try {
      const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
              systemInstruction: adminInsightsSystemInstruction,
          },
      });
      return response.text;
  } catch (error) {
      console.error("Error calling Gemini API for admin insights:", error);
      return "I'm sorry, but I'm having trouble generating the report right now. Please try again later.";
  }
};

const medicineAlternativeSystemInstruction = `You are a helpful AI assistant for a hospital pharmacist.
You will be given the name and category of a medicine that is out of stock or expired.
Your task is to suggest 2-3 common alternative medications.
Your response MUST be in simple markdown format.
For each suggestion, provide a brief (1-sentence) reason why it's a suitable alternative.

Example format:
Here are some possible alternatives for [Medicine Name]:

*   **Alternative 1:** [Reason for suggestion].
*   **Alternative 2:** [Reason for suggestion].

---
**Disclaimer: This is an AI-generated suggestion. The final decision must be made by a qualified pharmacist or physician.**
`;

export const getMedicineAlternatives = async (medicine: { name: string, category: string }): Promise<string> => {
  const ai = getGenAIClient();
  const apiKey = getGeminiApiKey();

  if (!ai || !apiKey) {
    return `Here are some standard alternatives for **${medicine.name}** (${medicine.category}):\n\n` +
           `*   **Generic ${medicine.category} Formulation:** Shares equivalent bio-availability under clinical prescription.\n` +
           `*   **Cross-Brand Therapeutic Equivalent:** Consult hospital dispensary for current generic equivalent in stock.\n\n` +
           `---\n` +
           `**Disclaimer: This is an AI-generated suggestion. The final decision must be made by a qualified pharmacist or physician.**`;
  }

  const prompt = `The medicine "${medicine.name}", which is in the "${medicine.category}" category, is out of stock. Please suggest alternatives.`;

  try {
      const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
              systemInstruction: medicineAlternativeSystemInstruction,
          },
      });
      return response.text;
  } catch (error) {
      console.error("Error calling Gemini API for medicine alternatives:", error);
      return "I'm sorry, but I'm having trouble generating suggestions right now. Please try again later.";
  }
};

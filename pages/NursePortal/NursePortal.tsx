import React, { useState, useMemo } from 'react';
import type { User, AssignedPatient, Appointment } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MOCK_ASSIGNED_PATIENTS, MOCK_NURSE_TASKS, MOCK_DOCTORS, MOCK_CHARTS, MOCK_APPOINTMENTS } from '../../constants';
import PatientChartModal from '../../components/PatientChartModal';

const NursePortal: React.FC<{ user: User }> = ({ user }) => {
  const [activeModal, setActiveModal] = useState<'chart' | 'page' | 'supplies' | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<AssignedPatient | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const assistanceRequests = useMemo(() => {
    try {
      const saved = localStorage.getItem('hms_appointments');
      const apps: Appointment[] = saved ? JSON.parse(saved) : MOCK_APPOINTMENTS;
      return apps.filter(a => a.accessibilityRequest && a.status === 'Upcoming');
    } catch (e) {
      return [];
    }
  }, []);

  // State for Page Doctor Modal
  const [pageDoctorId, setPageDoctorId] = useState('');
  const [pageMessage, setPageMessage] = useState('');
  
  // State for Request Supplies Modal
  const [supplyItem, setSupplyItem] = useState('');
  const [supplyQuantity, setSupplyQuantity] = useState('1');

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleViewChart = (patient: AssignedPatient) => {
    setSelectedPatient(patient);
    setActiveModal('chart');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedPatient(null);
  };
  
  const handleSendPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageDoctorId || !pageMessage) {
        alert("Please select a doctor and enter a message.");
        return;
    }
    const doctor = MOCK_DOCTORS.find(d => d.id === pageDoctorId);
    showNotification(`Successfully paged ${doctor?.name}.`);
    setPageDoctorId('');
    setPageMessage('');
    handleCloseModal();
  };
  
  const handleRequestSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyItem || !supplyQuantity || parseInt(supplyQuantity) < 1) {
        alert("Please enter a valid item and quantity.");
        return;
    }
    showNotification(`Supply request for "${supplyItem} (x${supplyQuantity})" sent.`);
    setSupplyItem('');
    setSupplyQuantity('1');
    handleCloseModal();
  };

  const handleDownloadShiftReport = () => {
    try {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("Nurse Shift Report", 14, 22);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Nurse: ${user.name}`, 14, 28);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 34);
        
        const head = [['Patient Name', 'Room', 'Status', 'Vitals (BP, Temp, HR)']];
        const body = MOCK_ASSIGNED_PATIENTS.map(p => [
            p.name,
            p.room,
            p.status,
            `BP: ${p.vitals.bp}, Temp: ${p.vitals.temp}, HR: ${p.vitals.hr}`
        ]);

        autoTable(doc, {
            startY: 45,
            head: head,
            body: body,
            headStyles: { fillColor: [139, 92, 246] }, // Purple nurse theme color
        });

        doc.save(`Nurse_Shift_Report_${user.name.replace(/\s/g, '_')}.pdf`);
    } catch (err) {
        console.error("PDF Generation Error:", err);
        alert("An error occurred while generating the PDF. Please check the console for details.");
    }
  };
  
  const NotificationBanner = () => (
    notification && (
        <div className="fixed top-20 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fadeIn z-50">
            {notification}
        </div>
    )
  );

  return (
    <>
      <NotificationBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nurse Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome, {user.name}. Here's your shift overview.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assigned Patients */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">Assigned Patients</h2>
               <button 
                  onClick={handleDownloadShiftReport}
                  className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition text-sm"
                >
                  Download Shift Report
                </button>
            </div>
            <div className="space-y-4">
              {MOCK_ASSIGNED_PATIENTS.map(patient => (
                <div key={patient.id} className="p-4 bg-light dark:bg-dark-bg rounded-lg border-l-4 border-purple-500">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-lg dark:text-dark-text">{patient.name} <span className="font-normal text-sm text-gray-500 dark:text-gray-400">- Room {patient.room}</span></p>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{patient.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewChart(patient)} className="text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-semibold py-1 px-3 rounded-full hover:bg-purple-200 transition">
                        View Chart
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Vitals:</span> BP: {patient.vitals.bp}, Temp: {patient.vitals.temp}, HR: {patient.vitals.hr}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Verified Patient Accessibility & Assistance Queue */}
            <div className="mt-8 pt-6 border-t dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">♿</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Patient Accessibility & Transit Requests ({assistanceRequests.length})
                  </h3>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                  Orderly & Nursing Alerts
                </span>
              </div>

              {assistanceRequests.length > 0 ? (
                <div className="space-y-3">
                  {assistanceRequests.map(req => (
                    <div key={req.id} className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">
                            {req.patientName}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            with {req.doctorName} ({req.doctorSpecialization})
                          </span>
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-0.5">
                          Appointment: {new Date(req.date + 'T00:00:00').toLocaleDateString()} at {req.time}
                        </p>
                        
                        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                          {req.accessibilityRequest?.wheelchairNeeded && (
                            <span className="bg-blue-100 text-blue-900 dark:bg-blue-900/80 dark:text-blue-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-300">
                              <span>♿</span> Wheelchair: {req.accessibilityRequest.wheelchairLocation || 'Assistance Needed'}
                            </span>
                          )}
                          {req.accessibilityRequest?.writtenInstructions && (
                            <span className="bg-purple-100 text-purple-900 dark:bg-purple-900/80 dark:text-purple-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-300">
                              <span>📄</span> Provide Printed Instructions
                            </span>
                          )}
                          {req.accessibilityRequest?.communicationSupport && req.accessibilityRequest.communicationSupport !== 'None' && (
                            <span className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                              <span>🗣️</span> {req.accessibilityRequest.communicationSupport}
                            </span>
                          )}
                          {req.accessibilityRequest?.assistanceNotes && (
                            <span className="text-[11px] text-gray-600 dark:text-gray-300 italic bg-white dark:bg-dark-card px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                              "{req.accessibilityRequest.assistanceNotes}"
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => showNotification(`Transit Orderly assigned for ${req.patientName}.`)}
                        className="self-start sm:self-center text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3 rounded-lg shadow-sm transition whitespace-nowrap"
                      >
                        Assign Orderly →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">No pending accessibility or wheelchair assistance requests for this shift.</p>
              )}
            </div>
          </div>

          {/* Shift To-Do List */}
          <div className="lg:col-span-1 bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Shift To-Do List</h2>
            <ul className="space-y-3">
              {MOCK_NURSE_TASKS.map((task, index) => (
                <li key={index} className="flex items-start p-3 bg-light dark:bg-dark-bg rounded-md">
                  <input id={`task-${index}`} type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <label htmlFor={`task-${index}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">{task}</label>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
                  <button onClick={() => setActiveModal('page')} className="w-full bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Page Doctor</button>
                  <button onClick={() => setActiveModal('supplies')} className="w-full bg-primary/20 text-primary dark:bg-primary/30 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/30 dark:hover:bg-primary/40 transition">Request Supplies</button>
              </div>
          </div>
        </div>
      </div>
      
      {activeModal === 'chart' && selectedPatient && (
        <PatientChartModal 
            patient={selectedPatient}
            chartData={MOCK_CHARTS.find(c => c.patientId === selectedPatient.id)}
            onClose={handleCloseModal}
        />
      )}

      {activeModal === 'page' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">Page a Doctor</h2>
                <form onSubmit={handleSendPage} className="space-y-4">
                    <div>
                        <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Doctor</label>
                        <select id="doctor" value={pageDoctorId} onChange={e => setPageDoctorId(e.target.value)} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="" disabled>Select a doctor</option>
                            {MOCK_DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name} - {d.specialization}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                        <textarea id="message" rows={3} value={pageMessage} onChange={e => setPageMessage(e.target.value)} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Urgent: Please check on patient in Room 101A."></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Send Page</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {activeModal === 'supplies' && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">Request Supplies</h2>
                <form onSubmit={handleRequestSupply} className="space-y-4">
                    <div>
                        <label htmlFor="item" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item</label>
                        <input type="text" id="item" value={supplyItem} onChange={e => setSupplyItem(e.target.value)} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g., Saline Bags" />
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                        <input type="number" id="quantity" value={supplyQuantity} onChange={e => setSupplyQuantity(e.target.value)} required min="1" className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
};

export default NursePortal;
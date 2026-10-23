import React, { useState } from 'react';
import type { User, LabTest } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveLabTest as dbSaveLabTest, saveMedicalRecord as dbSaveMedicalRecord } from '../../services/database';

interface LabPortalProps {
    user: User;
    labTests: LabTest[];
    setLabTests: React.Dispatch<React.SetStateAction<LabTest[]>>;
}

const LabPortal: React.FC<LabPortalProps> = ({ user, labTests, setLabTests }) => {
    const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [resultNotes, setResultNotes] = useState('');
    const [notification, setNotification] = useState<string | null>(null);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 4000);
    };

    const handleUpdateStatus = (id: string, newStatus: LabTest['status']) => {
        let updatedTest: LabTest | undefined;
        setLabTests(prev => prev.map(t => {
            if (t.id === id) {
                updatedTest = { ...t, status: newStatus };
                return updatedTest;
            }
            return t;
        }));
        if (updatedTest) {
            dbSaveLabTest(updatedTest);
        }
        showNotification(`Test #${id} status updated to "${newStatus}".`);
    };

    const handleOpenResultsModal = (test: LabTest) => {
        setSelectedTest(test);
        setResultNotes(test.results || '');
        setModalOpen(true);
    };

    const handleSaveResults = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTest) return;
        const updatedTest: LabTest = { ...selectedTest, status: 'Completed', results: resultNotes };
        setLabTests(prev => prev.map(t => (t.id === selectedTest.id ? updatedTest : t)));
        dbSaveLabTest(updatedTest);

        // Also create a verified clinical medical record in Supabase
        dbSaveMedicalRecord({
            id: `rec_lab_${Date.now()}`,
            patientId: selectedTest.patientName.toLowerCase().replace(/\s+/g, '_'),
            date: new Date().toISOString().split('T')[0],
            type: 'Lab Result',
            title: selectedTest.testType,
            summary: resultNotes || 'Diagnostic testing verified and completed.',
            doctorName: selectedTest.requestedBy,
            fileUrl: '#'
        });

        showNotification(`Results saved and published for test #${selectedTest.id}.`);
        setModalOpen(false);
        setSelectedTest(null);
        setResultNotes('');
    };
    
    const getStatusColor = (status: LabTest['status']) => {
        switch (status) {
            case 'Pending': return 'border-yellow-500';
            case 'In Progress': return 'border-blue-500';
            case 'Completed': return 'border-green-500';
        }
    };

    const handleDownloadPdf = (test: LabTest) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const patientName = test?.patientName || 'Patient';
            const testId = test?.id || 'Unknown';
            const testType = test?.testType || 'Diagnostic Test';
            const safeDate = test?.date ? (isNaN(new Date(test.date).getTime()) ? test.date : new Date(test.date).toLocaleDateString()) : 'N/A';
            const requestedBy = test?.requestedBy || 'Attending Physician';
            const results = test?.results || 'No results entered.';

            // Header
            doc.setDrawColor(0, 87, 168);
            doc.setLineWidth(1);
            doc.circle(20, 20, 8);
            doc.line(20, 15, 20, 25);
            doc.line(15, 20, 25, 20);
            doc.setTextColor(0, 87, 168);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text("MediConnect HMS", 35, 20);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text("Laboratory Test Report", 35, 27);
            doc.setLineWidth(0.5);
            doc.line(10, 35, pageWidth - 10, 35);

            // Patient & Test Details Table
            autoTable(doc, {
                body: [
                    [{content: 'Patient & Test Information', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' }}],
                    ['Patient Name:', patientName],
                    ['Test ID:', testId],
                    ['Test Type:', testType],
                    ['Date Reported:', safeDate],
                    ['Requested By:', requestedBy],
                ],
                startY: 40,
                theme: 'grid',
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto' } }
            });
            
            // Results Section
            autoTable(doc, {
                head: [['Results']],
                body: [
                    [results]
                ],
                headStyles: { fillColor: [0, 87, 168] }
            });

            // Footer
            const finalY = (doc as any).lastAutoTable?.finalY ?? 60;
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Verified by: ${user?.name || 'Lab Technician'} (${user?.department || 'Laboratory'})`, 14, finalY + 15);
            doc.line(14, finalY + 17, 80, finalY + 17);
            
            const sanitizedFileName = patientName.replace(/[^a-zA-Z0-9_-]/g, '_');
            doc.save(`LabReport_${sanitizedFileName}_${testId}.pdf`);
        } catch (err) {
            console.error("Lab Report PDF generation error:", err);
            alert("Failed to download lab report PDF. Please try again.");
        }
    };

    const NotificationBanner = () => (
        notification && (
            <div className="fixed top-20 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fadeIn z-50">
                {notification}
            </div>
        )
    );

    const safeLabTests = Array.isArray(labTests) ? labTests : [];
    const testsInProgress = safeLabTests.filter(t => t?.status === 'In Progress');
    const testsPending = safeLabTests.filter(t => t?.status === 'Pending');
    const testsCompleted = safeLabTests.filter(t => t?.status === 'Completed');

    return (
        <>
            <NotificationBanner />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lab Dashboard</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome, {user?.name || 'Lab Staff'} ({user?.department || 'Laboratory'}).</p>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Work Queue */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* In Progress */}
                        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">In Progress ({testsInProgress.length})</h2>
                            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {testsInProgress.length > 0 ? testsInProgress.map(test => (
                                    <div key={test.id} className={`p-4 bg-light dark:bg-dark-bg rounded-lg border-l-4 ${getStatusColor(test.status)}`}>
                                        <p className="font-bold dark:text-dark-text">{test.testType}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Patient: {test.patientName || 'Unknown'} | Req by: {test.requestedBy || 'N/A'}</p>
                                        <button onClick={() => handleOpenResultsModal(test)} className="mt-2 text-sm bg-secondary text-white font-semibold py-1 px-3 rounded-md hover:bg-green-600">Enter Results</button>
                                    </div>
                                )) : <p className="text-gray-500 dark:text-gray-400">No tests currently in progress.</p>}
                            </div>
                        </div>
                        {/* Pending */}
                        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Pending Requests ({testsPending.length})</h2>
                            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {testsPending.length > 0 ? testsPending.map(test => (
                                    <div key={test.id} className={`p-4 bg-light dark:bg-dark-bg rounded-lg border-l-4 ${getStatusColor(test.status)}`}>
                                        <p className="font-bold dark:text-dark-text">{test.testType}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Patient: {test.patientName || 'Unknown'} | Req by: {test.requestedBy || 'N/A'}</p>
                                        <button onClick={() => handleUpdateStatus(test.id, 'In Progress')} className="mt-2 text-sm bg-blue-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-600">Start Test</button>
                                    </div>
                                )) : <p className="text-gray-500 dark:text-gray-400">No pending test requests.</p>}
                            </div>
                        </div>
                    </div>
                    {/* Completed Tests */}
                    <div className="lg:col-span-1 bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Completed Tests</h2>
                        <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-2">
                            {testsCompleted.length > 0 ? testsCompleted.map(test => (
                                <div key={test.id} className={`p-3 bg-light dark:bg-dark-bg rounded-md border-l-4 ${getStatusColor(test.status)}`}>
                                    <p className="font-semibold dark:text-dark-text text-sm">{test.testType} - {test.patientName || 'Patient'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Completed on {test.date || 'N/A'}</p>
                                    <button onClick={() => handleDownloadPdf(test)} className="text-xs text-primary dark:text-blue-400 hover:underline mt-1">Download PDF</button>
                                </div>
                            )) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm py-4">No completed lab tests yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && selectedTest && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">Enter Results</h2>
                        <p className="mb-1 dark:text-gray-300">Test: <strong>{selectedTest.testType}</strong></p>
                        <p className="mb-4 dark:text-gray-300">Patient: <strong>{selectedTest.patientName}</strong></p>
                        <form onSubmit={handleSaveResults}>
                            <textarea
                                value={resultNotes}
                                onChange={e => setResultNotes(e.target.value)}
                                rows={5}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter results and any relevant notes here..."
                            />
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                                <button type="submit" className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Save & Mark Completed</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default LabPortal;
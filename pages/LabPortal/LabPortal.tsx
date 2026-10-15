import React, { useState } from 'react';
import type { User, LabTest } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        setLabTests(prev => prev.map(t => (t.id === id ? { ...t, status: newStatus } : t)));
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
        setLabTests(prev => prev.map(t => (
            t.id === selectedTest.id ? { ...t, status: 'Completed', results: resultNotes } : t
        )));
        showNotification(`Results saved for test #${selectedTest.id}.`);
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
                    ['Patient Name:', test.patientName],
                    ['Test ID:', test.id],
                    ['Test Type:', test.testType],
                    ['Date Reported:', new Date(test.date).toLocaleDateString()],
                    ['Requested By:', test.requestedBy],
                ],
                startY: 40,
                theme: 'grid',
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto' } }
            });
            
            // Results Section
            autoTable(doc, {
                head: [['Results']],
                body: [
                    [test.results || 'No results entered.']
                ],
                headStyles: { fillColor: [0, 87, 168] }
            });

            // Footer
            const finalY = (doc as any).lastAutoTable?.finalY ?? 60;
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Verified by: ${user.name} (${user.department})`, 14, finalY + 15);
            doc.line(14, finalY + 17, 80, finalY + 17);
            
            doc.save(`LabReport_${test.patientName.replace(/\s/g, '_')}_${test.id}.pdf`);
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

    const testsInProgress = labTests.filter(t => t.status === 'In Progress');
    const testsPending = labTests.filter(t => t.status === 'Pending');
    const testsCompleted = labTests.filter(t => t.status === 'Completed');

    return (
        <>
            <NotificationBanner />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lab Dashboard</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome, {user.name} ({user.department}).</p>

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
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Patient: {test.patientName} | Req by: {test.requestedBy}</p>
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
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Patient: {test.patientName} | Req by: {test.requestedBy}</p>
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
                            {testsCompleted.map(test => (
                                <div key={test.id} className={`p-3 bg-light dark:bg-dark-bg rounded-md border-l-4 ${getStatusColor(test.status)}`}>
                                    <p className="font-semibold dark:text-dark-text text-sm">{test.testType} - {test.patientName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Completed on {test.date}</p>
                                    <button onClick={() => handleDownloadPdf(test)} className="text-xs text-primary dark:text-blue-400 hover:underline mt-1">Download PDF</button>
                                </div>
                            ))}
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
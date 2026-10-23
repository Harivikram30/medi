import React, { useMemo } from 'react';
import { MOCK_RECORDS } from '../../constants';
import type { MedicalRecord, User, LabTest } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import EmptyState from '../../components/Common/EmptyState';
import { formatDisplayDate } from '../../services/dataSanitizer';


interface MedicalRecordsProps {
  patientId: string;
  user: User;
  labTests: LabTest[];
}

const MedicalRecords: React.FC<MedicalRecordsProps> = ({ patientId, user, labTests }) => {
  const combinedRecords = useMemo(() => {
    const recordsFromMocks = MOCK_RECORDS.filter(rec => rec.patientId === patientId)
        .map(rec => ({ ...rec, source: 'mock' as const, originalTest: null }));

    const recordsFromLab = labTests.filter(test => test.patientName === user.name)
        .map(test => ({
            id: test.id,
            patientId: patientId,
            date: test.date,
            type: 'Lab Result' as const,
            title: test.testType,
            summary: test.status === 'Completed' ? (test.results || 'Results available to view.') : `Status: ${test.status}`,
            doctorName: test.requestedBy,
            fileUrl: '#',
            source: 'lab' as const,
            originalTest: test,
        }));

    return [...recordsFromMocks, ...recordsFromLab]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [patientId, user.name, labTests]);

  const getIcon = (type: MedicalRecord['type']) => {
    switch(type) {
      case 'Lab Result': return '🔬';
      case 'Prescription': return '💊';
      case 'Doctor\'s Note': return '📝';
      case 'Radiology Report': return '🦴';
      default: return '📄';
    }
  };
  
  const handleDownloadLabReportPdf = (test: LabTest) => {
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
          body: [[test.results || 'No results entered.']],
          headStyles: { fillColor: [0, 87, 168] }
      });
      
      doc.save(`LabReport_${test.patientName.replace(/\s/g, '_')}_${test.id}.pdf`);
    } catch (err) {
      console.error("Lab Report PDF generation error:", err);
      alert("Failed to download lab report PDF. Please try again.");
    }
  };
  
  const handleDownloadRecordPdf = (record: MedicalRecord) => {
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
      doc.text("Medical Record", 35, 27);
      doc.setLineWidth(0.5);
      doc.line(10, 35, pageWidth - 10, 35);
      
      // Patient Information Table
      autoTable(doc, {
        body: [
          ['Patient Name:', user.name],
          ['Record ID:', record.id],
          ['Date Issued:', new Date(record.date).toLocaleDateString()],
          ['Issuing Provider:', record.doctorName],
        ],
        startY: 40,
        theme: 'plain',
        styles: { fontSize: 11 },
        columnStyles: { 0: { fontStyle: 'bold' } }
      });
      
      // Record Details Table
      autoTable(doc, {
        head: [[record.type]],
        body: [
          ['Title', record.title],
          ['Summary', record.summary],
        ],
        headStyles: { fillColor: [0, 87, 168], fontSize: 14 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 'auto'} },
        didParseCell: function (data) {
          if (data.row.index === 1 && data.column.index === 1) { // Summary cell
              data.cell.styles.halign = 'left';
          }
        }
      });

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`© ${new Date().getFullYear()} MediConnect HMS. Confidential.`, 10, pageHeight - 10);
      
      doc.save(`MedicalRecord_${user.name.replace(/\s/g, '_')}_${record.id}.pdf`);
    } catch (err) {
      console.error("Medical Record PDF generation error:", err);
      alert("Failed to download medical record PDF. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text mb-6">Medical Records</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-dark-card">
          <thead className="bg-light dark:bg-dark-bg">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Date</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Type</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Details</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Provider</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-dark-text">
            {combinedRecords.length > 0 ? (
              combinedRecords.map(rec => (
                <tr key={`${rec.source}-${rec.id}`} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                  <td className="py-3 px-4">{formatDisplayDate(rec.date)}</td>
                  <td className="py-3 px-4">
                    <span className="mr-2">{getIcon(rec.type)}</span>{rec.type}
                  </td>
                  <td className="py-3 px-4">{rec.title}</td>
                  <td className="py-3 px-4">{rec.doctorName}</td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => {
                          if (rec.source === 'lab' && rec.originalTest) {
                              handleDownloadLabReportPdf(rec.originalTest);
                          } else if (rec.source === 'mock') {
                              handleDownloadRecordPdf(rec as MedicalRecord);
                          }
                      }} 
                      disabled={rec.source === 'lab' && rec.originalTest?.status !== 'Completed'}
                      className="text-primary dark:text-blue-400 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8">
                  <EmptyState
                    icon="📁"
                    title="No medical records found"
                    description="No medical records or lab reports are available for your profile yet."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicalRecords;
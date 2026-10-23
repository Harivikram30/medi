
import React from 'react';
import type { Prescription, User, Doctor } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import EmptyState from '../../components/Common/EmptyState';
import { formatDisplayDate } from '../../services/dataSanitizer';

interface PrescriptionsProps {
  user: User;
  prescriptions: Prescription[];
  doctors: Doctor[];
}

const Prescriptions: React.FC<PrescriptionsProps> = ({ user, prescriptions = [], doctors = [] }) => {

  const handleDownloadPdf = (prescription: Prescription) => {
    try {
      const doc = new jsPDF();
      const doctor = doctors.find(d => d.id === prescription.doctorId);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- Header ---
      doc.setDrawColor(0, 87, 168); // primary color
      doc.setLineWidth(0.5);
      doc.circle(20, 20, 8); // Circle
      doc.setLineWidth(1);
      doc.line(20, 16, 20, 24); // Vertical line of plus
      doc.line(16, 20, 24, 20); // Horizontal line of plus

      doc.setTextColor(0, 87, 168);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text("MediConnect HMS", 32, 22);
      
      doc.setTextColor(100);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('Prescription', pageWidth - 20, 25, { align: 'right' });
      doc.setLineWidth(0.2);
      doc.line(14, 35, pageWidth - 14, 35);
      
      doc.setTextColor(0, 0, 0);

      // --- Patient & Doctor Info ---
      autoTable(doc, {
          body: [
              [
                  { content: `Patient: ${user.name}\nPatient ID: ${user.id}`, styles: { fontStyle: 'bold' } },
                  { content: `Date Issued: ${new Date(prescription.date).toLocaleDateString()}`, styles: { halign: 'right' } }
              ],
              [
                  { content: `Prescribing Doctor: ${prescription.doctorName}\nDepartment: ${doctor?.specialization || 'N/A'}` },
                  { content: `Prescription ID: ${prescription.id}`, styles: { halign: 'right' } }
              ]
          ],
          startY: 40,
          theme: 'plain',
      });

      // --- Prescription Details ---
      const lastY = (doc as any).lastAutoTable?.finalY ?? 60;
      doc.setFontSize(24);
      doc.setFont('helvetica', 'normal');
      doc.text('Rx', 14, lastY + 15);

      autoTable(doc, {
          startY: lastY + 20,
          head: [['Medication', 'Dosage', 'Frequency', 'Duration']],
          body: [
              [prescription.medication, prescription.dosage, prescription.frequency, prescription.duration]
          ],
          headStyles: { fillColor: [0, 87, 168] },
          theme: 'striped',
      });
      
      if (prescription.notes) {
          const notesY = (doc as any).lastAutoTable?.finalY ?? (lastY + 40);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Notes:', 14, notesY + 10);
          doc.setFont('helvetica', 'normal');
          doc.text(prescription.notes, 14, notesY + 15, { maxWidth: pageWidth - 28 });
      }
      
      // --- Signature ---
      const sigY = pageHeight - 50;
      doc.setLineWidth(0.5);
      doc.line(pageWidth - 70, sigY, pageWidth - 20, sigY);
      doc.setFontSize(10);
      doc.text(prescription.doctorName, pageWidth - 45, sigY + 5, { align: 'center' });
      doc.text('Signature', pageWidth - 45, sigY + 10, { align: 'center' });


      // --- Footer ---
      const footerY = pageHeight - 20;
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      doc.line(14, footerY, pageWidth - 14, footerY);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`© ${new Date().getFullYear()} MediConnect HMS. Confidential.`, pageWidth / 2, footerY + 8, { align: 'center' });

      doc.save(`Prescription_${user.name.replace(/\s/g, '_')}_${prescription.id}.pdf`);
    } catch (err) {
      console.error("Prescription PDF generation error:", err);
      alert("Failed to download prescription PDF. Please try again.");
    }
  };

  const getStatusInfo = (status: Prescription['status']) => {
    switch (status) {
      case 'Active':
        return {
          borderColor: 'border-blue-500',
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        };
      case 'Ready for Pickup':
        return {
          borderColor: 'border-purple-500',
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        };
      case 'Dispensed':
      case 'Completed':
        return {
          borderColor: 'border-green-500',
          badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        };
      case 'Cancelled':
        return {
          borderColor: 'border-red-500',
          badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        };
      default:
        return {
          borderColor: 'border-gray-400',
          badgeColor: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
        };
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text mb-6">Your Prescriptions</h2>
      <div className="space-y-6">
        {prescriptions.length > 0 ? (
          prescriptions.map(p => {
            const { borderColor, badgeColor } = getStatusInfo(p.status);
            return (
              <div key={p.id} className={`p-4 rounded-lg border-l-4 bg-light dark:bg-dark-bg ${borderColor}`}>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-dark-text">{p.medication} {p.dosage}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {p.frequency} for {p.duration}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Prescribed by {p.doctorName} on {formatDisplayDate(p.date)}
                    </p>
                    {p.notes && <p className="text-xs italic text-gray-500 dark:text-gray-300 mt-2">Notes: {p.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badgeColor}`}>
                      {p.status}
                    </span>
                    <button onClick={() => handleDownloadPdf(p)} className="bg-primary text-white font-semibold py-2 px-4 rounded-md text-sm hover:bg-primary/90 transition-colors">
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon="💊"
            title="No prescriptions found"
            description="You have no active or completed medical prescriptions on record."
          />
        )}
      </div>
    </div>
  );
};

export default Prescriptions;

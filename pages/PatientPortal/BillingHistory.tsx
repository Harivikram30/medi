import React from 'react';
import { MOCK_BILLS } from '../../constants';
import type { Bill, User } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillingHistoryProps {
  patientId: string;
  user: User;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({ patientId, user }) => {
  const bills = MOCK_BILLS.filter(bill => bill.patientId === patientId);
  
  const handleDownloadPdf = (bill: Bill) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- Header ---
      // Logo
      doc.setDrawColor(0, 87, 168); // primary color
      doc.setLineWidth(0.5);
      doc.circle(20, 20, 8); // Circle
      doc.setLineWidth(1);
      doc.line(20, 16, 20, 24); // Vertical line of plus
      doc.line(16, 20, 24, 20); // Horizontal line of plus

      // Hospital Name
      doc.setTextColor(0, 87, 168);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("MediConnect HMS", 32, 22);
      
      // Invoice Title
      doc.setTextColor(100); // Gray color
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth - 20, 25, { align: 'right' });

      // Line separator
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      doc.line(14, 35, pageWidth - 14, 35);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);

      // --- Bill To & Invoice Info Table ---
      autoTable(doc, {
        body: [
          [
            { content: `BILL TO:\n${user.name}\n${user.email}`, styles: { fontStyle: 'bold' } },
            { content: `Invoice ID: ${bill.id}\nDate: ${new Date(bill.date).toLocaleDateString()}\nStatus: ${bill.status}`, styles: { halign: 'right' } }
          ]
        ],
        startY: 40,
        theme: 'plain',
      });

      // --- Invoice Items Table ---
      const lastTableY = (doc as any).lastAutoTable?.finalY ?? 55;
      autoTable(doc, {
        head: [['Description', 'Amount']],
        body: [
          [bill.service, `$${bill.amount.toFixed(2)}`]
        ],
        foot: [
          [{ content: 'Total Due', styles: { halign: 'right', fontStyle: 'bold', fontSize: 12 } }, { content: `$${bill.amount.toFixed(2)}`, styles: { fontStyle: 'bold', fontSize: 12 } }]
        ],
        headStyles: { fillColor: [0, 87, 168] },
        footStyles: { fillColor: [234, 234, 234], textColor: 20 },
        startY: lastTableY + 10,
      });
      
      // --- Footer ---
      const footerY = pageHeight - 20;
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      doc.line(14, footerY, pageWidth - 14, footerY);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
          `© ${new Date().getFullYear()} MediConnect HMS. All rights reserved.`, 
          pageWidth / 2, 
          footerY + 8, 
          { align: 'center' }
      );
      doc.text(
          '123 Health St, Medcity, 12345 | contact@mediconnect.hms',
          pageWidth / 2,
          footerY + 12,
          { align: 'center' }
      );

      doc.save(`Invoice_${user.name.replace(/\s/g, '_')}_${bill.id}.pdf`);
    } catch (err) {
      console.error("Invoice PDF generation error:", err);
      alert("Failed to download invoice PDF. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text mb-6">Billing & Payments</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-dark-card">
          <thead className="bg-light dark:bg-dark-bg">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Date</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Service</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Amount</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Status</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-dark-text">
            {bills.map(bill => (
              <tr key={bill.id} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                <td className="py-3 px-4">{new Date(bill.date).toLocaleDateString()}</td>
                <td className="py-3 px-4">{bill.service}</td>
                <td className="py-3 px-4">${bill.amount.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    bill.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                  }`}>
                    {bill.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {bill.status === 'Due' ? (
                    <button className="bg-secondary text-white font-semibold py-1 px-3 rounded-md text-sm hover:bg-green-600">Pay Now</button>
                  ) : (
                    <button onClick={() => handleDownloadPdf(bill)} className="text-primary dark:text-blue-400 font-semibold hover:underline text-sm">Download PDF</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingHistory;
'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import InvoiceReceipt from './InvoiceReceipt';
import type { ReceiptData } from '@/types/billing';

interface InvoiceReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
  /** Label for the bottom dismiss button — differs by context (e.g. "Done — New Invoice" vs "Close"). */
  closeLabel?: string;
}

/**
 * Shared print/download-PDF modal for a single invoice receipt — used both
 * right after creating a new invoice and when reprinting a past one from
 * the invoice history list.
 */
export default function InvoiceReceiptModal({
  receipt,
  onClose,
  closeLabel = 'Close',
}: InvoiceReceiptModalProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!receiptRef.current || !receipt) return;

    setIsDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ unit: 'mm', format: 'a5' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${receipt.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate invoice PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={!!receipt}
      onClose={onClose}
      title={receipt ? `Invoice ${receipt.invoiceNumber}` : 'Invoice'}
    >
      {receipt && (
        <div className="space-y-5">
          <div className="overflow-x-auto">
            <div ref={receiptRef}>
              <InvoiceReceipt receipt={receipt} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              className="py-2.5 rounded-lg text-sm font-semibold border border-gray-700 text-gray-200 hover:border-cyan hover:text-cyan transition-all"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-purple text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDownloadingPdf ? 'Generating…' : '⬇️ Download PDF'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {closeLabel}
          </button>
        </div>
      )}
    </Modal>
  );
}

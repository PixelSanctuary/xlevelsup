'use client';

import { storeConfig } from '@/config/store.config';
import { CGST_RATE_LABEL, SGST_RATE_LABEL } from '@/lib/billing-tax';
import type { ReceiptData } from '@/types/billing';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

interface InvoiceReceiptProps {
  receipt: ReceiptData;
  /** Renders inline (normal document flow) for batch printing instead of taking over the full page on its own. */
  forBulkPrint?: boolean;
}

/** Faint repeating diagonal watermark of the store name, tiled as a background pattern. */
function buildWatermark(text: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>
    <text x='0' y='120' font-family='Arial, sans-serif' font-size='18' font-weight='700'
      fill='rgba(0,0,0,0.05)' transform='rotate(-30 110 110)'>${text}</text>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function InvoiceReceipt({ receipt, forBulkPrint = false }: InvoiceReceiptProps) {
  const watermark = buildWatermark(storeConfig.name);

  return (
    <div
      className={`invoice-a5 ${forBulkPrint ? 'invoice-a5--inline' : 'invoice-a5--single'}`}
      style={{ backgroundImage: watermark, backgroundRepeat: 'repeat' }}
    >
      <style>{`
        @media screen {
          .invoice-a5 {
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.35);
            border-radius: 2mm;
            overflow: hidden;
          }
        }

        @media print {
          @page {
            size: A5 portrait;
            margin: 0;
          }

          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          .invoice-a5,
          .invoice-a5 * {
            visibility: visible;
          }

          .invoice-a5 {
            box-shadow: none;
          }

          .invoice-a5--single {
            position: fixed;
            top: 0;
            left: 0;
          }
        }

        /* A5 page: 148mm x 210mm. Padding lives on the page itself (not
           @page margin) so print and the PDF-download path — which
           captures this element directly and knows nothing about @page —
           produce identical margins. */
        .invoice-a5 {
          width: 148mm;
          min-height: 210mm;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 10mm;
          display: flex;
          flex-direction: column;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
          background-color: #fff;
          font-size: 10.5px;
        }

        .invoice-a5__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 6mm;
          padding-bottom: 4mm;
          border-bottom: 2px solid #111;
        }

        .invoice-a5__tax-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #00c2d1;
        }

        .invoice-a5__logo {
          height: 6mm;
          width: auto;
          display: block;
          margin-top: 1.5mm;
        }

        .invoice-a5__legal-name {
          margin-top: 1.5mm;
          font-size: 9.5px;
          font-weight: 700;
          color: #111;
        }

        .invoice-a5__store-detail {
          margin-top: 0.6mm;
          font-size: 8px;
          line-height: 1.3;
          color: #555;
        }

        .invoice-a5__invoice-meta {
          text-align: right;
          flex-shrink: 0;
        }

        .invoice-a5__invoice-number {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: #111;
        }

        .invoice-a5__invoice-meta-row {
          margin-top: 1.3mm;
          font-size: 8.5px;
          color: #555;
        }

        .invoice-a5__badge {
          display: inline-block;
          margin-top: 2.5mm;
          padding: 1mm 2.5mm;
          border-radius: 3mm;
          background: rgba(0, 194, 209, 0.1);
          border: 0.5px solid rgba(0, 194, 209, 0.5);
          color: #00949f;
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-a5__bill-to-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #888;
        }

        .invoice-a5__bill-to-name {
          margin-top: 1.3mm;
          font-size: 11px;
          font-weight: 700;
          color: #111;
        }

        .invoice-a5__bill-to-detail {
          margin-top: 0.8mm;
          font-size: 9px;
          color: #444;
        }

        .invoice-a5 table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6mm;
        }

        .invoice-a5 th {
          text-align: left;
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #333;
          padding: 2mm 1.5mm;
          border-top: 1px solid #111;
          border-bottom: 1.5px solid #111;
          border-right: 1px solid #111;
        }

        .invoice-a5 th:last-child {
          border-right: none;
        }

        .invoice-a5 td {
          font-size: 9.5px;
          padding: 2mm 1.5mm;
          border-bottom: 0.5px solid #ddd;
          vertical-align: top;
        }

        .invoice-a5__col-idx {
          width: 6mm;
          color: #888;
        }

        .invoice-a5__num {
          text-align: right;
          white-space: nowrap;
        }

        .invoice-a5__totals {
          margin-top: 5mm;
          margin-left: auto;
          width: 65mm;
        }

        .invoice-a5__totals-row {
          display: flex;
          justify-content: space-between;
          padding: 1.2mm 0;
          font-size: 9.5px;
          color: #333;
        }

        /* Gradient "border" via a two-layer nested box (outer gradient fill,
           inner white inset) rather than border-image/background-clip —
           the html2canvas PDF-download path renders plain nested
           backgrounds reliably but has spotty support for those. */
        .invoice-a5__grand-total {
          margin-top: 1.5mm;
          padding: 1.5px;
          background: linear-gradient(90deg, #00c2d1, #b026ff);
          border-radius: 1mm;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-a5__grand-total-inner {
          padding: 2.5mm 3mm;
          background: #fff;
          color: #111;
          font-weight: 700;
          font-size: 11.5px;
          display: flex;
          justify-content: space-between;
          border-radius: calc(1mm - 1.5px);
        }

        .invoice-a5__notes {
          margin-top: 5mm;
          font-size: 9px;
          color: #444;
        }

        .invoice-a5__footer {
          margin-top: auto;
          padding-top: 4mm;
          border-top: 1px dashed #999;
          text-align: center;
        }

        .invoice-a5__footer-note {
          font-size: 8px;
          color: #888;
          font-style: italic;
        }
      `}</style>

      {/* Header */}
      <div className="invoice-a5__header">
        <div>
          <div className="invoice-a5__tax-label">Tax Invoice</div>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered into html2canvas/print snapshots, not a normal page image */}
          <img
            src="/xlevelsup_logo_footer.svg"
            alt={storeConfig.name}
            className="invoice-a5__logo"
          />
          {storeConfig.legalName && (
            <div className="invoice-a5__legal-name">{storeConfig.legalName}</div>
          )}
          {[storeConfig.addressLine1, storeConfig.addressLine2, storeConfig.cityStatePincode]
            .filter(Boolean)
            .map((line, index) => (
              <div key={index} className="invoice-a5__store-detail">
                {line}
              </div>
            ))}
          {storeConfig.gstin && (
            <div className="invoice-a5__store-detail">GSTIN: {storeConfig.gstin}</div>
          )}
          {storeConfig.phone && (
            <div className="invoice-a5__store-detail">Ph: {storeConfig.phone}</div>
          )}
        </div>
        <div className="invoice-a5__invoice-meta">
          <div className="invoice-a5__invoice-number">{receipt.invoiceNumber}</div>
          <div className="invoice-a5__invoice-meta-row">
            Issued{' '}
            {new Date(receipt.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="invoice-a5__invoice-meta-row">Order #: {receipt.orderNumber}</div>
          <span className="invoice-a5__badge">{receipt.paymentMethod.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Bill to */}
      <div>
        <div className="invoice-a5__bill-to-label">Bill To</div>
        <div className="invoice-a5__bill-to-name">{receipt.clientName}</div>
        {receipt.clientPhone && (
          <div className="invoice-a5__bill-to-detail">{receipt.clientPhone}</div>
        )}
      </div>

      {/* Line items */}
      <table>
        <thead>
          <tr>
            <th className="invoice-a5__col-idx">#</th>
            <th>Description</th>
            <th className="invoice-a5__num">Qty</th>
            <th className="invoice-a5__num">Unit Price</th>
            <th className="invoice-a5__num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, index) => (
            <tr key={index}>
              <td className="invoice-a5__col-idx">{index + 1}</td>
              <td>{item.description}</td>
              <td className="invoice-a5__num">{item.quantity}</td>
              <td className="invoice-a5__num">
                {currencyFormatter.format(item.quantity > 0 ? item.lineTotal / item.quantity : 0)}
              </td>
              <td className="invoice-a5__num">{currencyFormatter.format(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="invoice-a5__totals">
        <div className="invoice-a5__totals-row">
          <span>Taxable Value</span>
          <span>{currencyFormatter.format(receipt.taxableValue)}</span>
        </div>
        <div className="invoice-a5__totals-row">
          <span>CGST @ {CGST_RATE_LABEL}</span>
          <span>{currencyFormatter.format(receipt.cgstAmount)}</span>
        </div>
        <div className="invoice-a5__totals-row">
          <span>SGST @ {SGST_RATE_LABEL}</span>
          <span>{currencyFormatter.format(receipt.sgstAmount)}</span>
        </div>
        <div className="invoice-a5__grand-total">
          <div className="invoice-a5__grand-total-inner">
            <span>Grand Total</span>
            <span>{currencyFormatter.format(receipt.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer — pushed to the bottom of the A5 page via margin-top: auto,
          so short invoices still look like a full page, not a floating card. */}
      <div className="invoice-a5__footer">
        <div className="invoice-a5__footer-note">
          This is a computer-generated invoice and does not require a signature.
        </div>
      </div>
    </div>
  );
}

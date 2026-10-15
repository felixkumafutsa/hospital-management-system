import { formatCurrency } from './currency';

export interface ThermalReceiptData {
  invoiceNo: string;
  createdAt?: string;
  total: number | string;
  paidAmount?: number | string;
  patient?: {
    firstName?: string;
    lastName?: string;
    patientNumber?: string;
  } | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number | string;
    subtotal: number | string;
  }>;
  payment?: {
    amount?: number | string;
    method?: string;
    reference?: string | null;
  } | null;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

export const printThermalReceipt = (receipt: ThermalReceiptData): Promise<void> => {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.title = 'Thermal receipt print view';
  frame.style.position = 'fixed';
  frame.style.width = '1px';
  frame.style.height = '1px';
  frame.style.left = '-10000px';
  frame.style.top = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const patientName = [receipt.patient?.firstName, receipt.patient?.lastName]
    .filter(Boolean)
    .join(' ');
  const receiptDate = receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleString()
    : new Date().toLocaleString();
  const items = receipt.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.description)}<br><small>${item.quantity} x ${escapeHtml(formatCurrency(Number(item.unitPrice)))}</small></td>
      <td class="amount">${escapeHtml(formatCurrency(Number(item.subtotal)))}</td>
    </tr>
  `).join('');
  const payment = receipt.payment;
  const amountPaid = payment?.amount ?? receipt.paidAmount ?? receipt.total;
  const content = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${escapeHtml(receipt.invoiceNo)}</title>
        <style>
          @page { size: 80mm auto; margin: 3mm; }
          * { box-sizing: border-box; }
          body { width: 74mm; margin: 0 auto; color: #111; font: 12px/1.4 Arial, sans-serif; }
          header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 8px; }
          h1 { font-size: 17px; margin: 0 0 3px; }
          p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 5px 0; vertical-align: top; }
          .amount { text-align: right; white-space: nowrap; }
          .totals { border-top: 1px dashed #333; margin-top: 6px; padding-top: 6px; }
          .total { font-size: 15px; font-weight: bold; }
          footer { text-align: center; border-top: 1px dashed #333; margin-top: 10px; padding-top: 8px; }
          small { font-size: 10px; }
        </style>
      </head>
      <body>
        <header>
          <h1>Better Life Clinic</h1>
          <p>Payment receipt</p>
          <p>${escapeHtml(receiptDate)}</p>
        </header>
        <p><strong>Receipt:</strong> ${escapeHtml(receipt.invoiceNo)}</p>
        ${patientName ? `<p><strong>Patient:</strong> ${escapeHtml(patientName)}</p>` : ''}
        ${receipt.patient?.patientNumber ? `<p><strong>Patient No:</strong> ${escapeHtml(receipt.patient.patientNumber)}</p>` : ''}
        <table><tbody>${items}</tbody></table>
        <div class="totals">
          <p class="total">Total: <span class="amount">${escapeHtml(formatCurrency(Number(receipt.total)))}</span></p>
          <p>Paid: <span class="amount">${escapeHtml(formatCurrency(Number(amountPaid)))}</span></p>
          ${payment?.method ? `<p>Method: ${escapeHtml(payment.method.replace(/_/g, ' '))}</p>` : ''}
          ${payment?.reference ? `<p>Reference: ${escapeHtml(payment.reference)}</p>` : ''}
        </div>
        <footer><p>Thank you for choosing Better Life Clinic</p></footer>
      </body>
    </html>
  `;

  return new Promise((resolve, reject) => {
    const printWindow = frame.contentWindow;
    const printDocument = frame.contentDocument;
    if (!printWindow || !printDocument) {
      frame.remove();
      reject(new Error('Could not prepare the receipt print view.'));
      return;
    }

    let cleanupTimer: number | undefined;
    const cleanup = () => {
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      frame.remove();
    };

    printWindow.onafterprint = cleanup;
    printDocument.open();
    printDocument.write(content);
    printDocument.close();

    window.setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        cleanupTimer = window.setTimeout(cleanup, 60_000);
        resolve();
      } catch (error) {
        cleanup();
        reject(error);
      }
    }, 100);
  });
};

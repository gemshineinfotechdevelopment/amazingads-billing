import { InvoiceCounter } from '../models/InvoiceCounter.js';
import { CompanySettings } from '../models/CompanySettings.js';

export const getNextInvoiceNumber = async (): Promise<string> => {
  // Fetch company settings for prefix, financial year, starting number
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({});
  }

  const prefix = settings.invoicePrefix || 'CAL';
  const fy = settings.financialYear || '2026-27';
  const identifier = `${prefix}-${fy}`;

  // Atomically increment the sequence counter
  const counter = await InvoiceCounter.findOneAndUpdate(
    { identifier },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  // If this is the first invoice in this series, offset by startingNumber
  let currentSeq = counter.seq;
  if (currentSeq === 1 && settings.startingNumber > 1) {
    const adjustedSeq = settings.startingNumber;
    await InvoiceCounter.findOneAndUpdate({ identifier }, { seq: adjustedSeq });
    currentSeq = adjustedSeq;
  }

  // Format: CAL/2026-27/0001 or CAL-1001
  const paddedSeq = String(currentSeq).padStart(4, '0');
  return `${prefix}/${fy}/${paddedSeq}`;
};

import { InvoiceCounter } from '../models/InvoiceCounter.js';
import { CompanySettings } from '../models/CompanySettings.js';

export const formatInvoiceNumber = (seq: number): string => {
  return `${seq}`;
};

/**
 * Preview the upcoming invoice number without incrementing the sequence counter.
 * Ideal for displaying on the New Billing Page counter before submission.
 */
export const peekNextInvoiceNumber = async (): Promise<string> => {
  const settings = await CompanySettings.findOne();
  const startNum = Math.max(1, settings?.startingNumber ?? 1);
  const identifier = 'invoice-sequence';

  const counter = await InvoiceCounter.findOne({ identifier });
  const nextSeq = counter && counter.seq >= startNum ? counter.seq + 1 : startNum;

  return `${nextSeq}`;
};

export const getNextInvoiceNumber = async (): Promise<string> => {
  const settings = await CompanySettings.findOne();
  const startNum = Math.max(1, settings?.startingNumber ?? 1);
  const identifier = 'invoice-sequence';

  const counter = await InvoiceCounter.findOne({ identifier });
  let currentSeq = startNum;

  if (!counter || counter.seq < startNum) {
    await InvoiceCounter.findOneAndUpdate(
      { identifier },
      { $set: { seq: startNum } },
      { upsert: true }
    );
    currentSeq = startNum;
  } else {
    const updated = await InvoiceCounter.findOneAndUpdate(
      { identifier },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    currentSeq = updated.seq;
  }

  return `${currentSeq}`;
};

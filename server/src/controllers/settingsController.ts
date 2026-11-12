import { Request, Response } from 'express';
import { CompanySettings } from '../models/CompanySettings.js';

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawData = { ...req.body };
    delete rawData._id;
    delete rawData.__v;
    delete rawData.createdAt;
    delete rawData.updatedAt;

    if (rawData.startingNumber !== undefined) {
      rawData.startingNumber = Math.max(1, Number(rawData.startingNumber) || 1001);
    }
    if (rawData.defaultGstRate !== undefined) {
      rawData.defaultGstRate = Math.max(0, Number(rawData.defaultGstRate) || 0);
    }
    if (rawData.invoicePrefix) {
      rawData.invoicePrefix = String(rawData.invoicePrefix).trim().toUpperCase();
    }
    if (rawData.financialYear) {
      rawData.financialYear = String(rawData.financialYear).trim();
    }
    if (rawData.gstin) {
      rawData.gstin = String(rawData.gstin).trim().toUpperCase();
    }

    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings(rawData);
    } else {
      Object.assign(settings, rawData);
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: settings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


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
    const updateData = req.body;

    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings();
    }

    Object.assign(settings, updateData);
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


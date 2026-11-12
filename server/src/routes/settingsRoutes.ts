import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// GET is accessible so public/login UI and dashboard can read company metadata
router.get('/', getSettings);

// PUT is strictly protected for authenticated admins only
router.put('/', authenticateAdmin, updateSettings);

export default router;


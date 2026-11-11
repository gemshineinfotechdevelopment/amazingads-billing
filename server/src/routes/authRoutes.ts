import { Router } from 'express';
import { login, getMe, changePassword, updateProfile } from '../controllers/authController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateAdmin, getMe);
router.put('/change-password', authenticateAdmin, changePassword);
router.put('/profile', authenticateAdmin, updateProfile);

export default router;


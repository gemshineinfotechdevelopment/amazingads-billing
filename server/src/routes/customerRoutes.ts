import { Router } from 'express';
import {
  getCustomers,
  lookupCustomerByMobile,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', getCustomers);
router.get('/lookup', lookupCustomerByMobile);
router.post('/', createCustomer);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;


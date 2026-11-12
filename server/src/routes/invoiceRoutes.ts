import { Router } from 'express';
import {
  getInvoices,
  getNextInvoiceNumberPreview,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  cancelInvoice,
  deleteInvoice,
} from '../controllers/invoiceController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', getInvoices);
router.get('/next-number', getNextInvoiceNumberPreview);
router.post('/', createInvoice);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.patch('/:id/cancel', cancelInvoice);
router.delete('/:id', deleteInvoice);

export default router;


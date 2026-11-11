import { Router } from 'express';
import {
  getDashboardStats,
  getDailySalesReport,
  getMonthlySalesReport,
  getYearlySalesReport,
  getProductSalesReport,
  getCategorySalesReport,
} from '../controllers/reportController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/daily-sales', getDailySalesReport);
router.get('/monthly-sales', getMonthlySalesReport);
router.get('/yearly-sales', getYearlySalesReport);
router.get('/product-sales', getProductSalesReport);
router.get('/category-sales', getCategorySalesReport);

export default router;


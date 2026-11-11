import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(express.json());

// In-memory data store for Amazing Ads Billing
let invoices = [
  {
    id: 'INV-1001',
    clientName: 'Alpha Tech Solutions',
    campaignName: 'Q1 Google Search Ads',
    amount: 45000,
    status: 'PAID',
    issueDate: '2026-10-15',
    dueDate: '2026-10-30',
  },
  {
    id: 'INV-1002',
    clientName: 'Fresh Mart Supermarket',
    campaignName: 'Instagram & Facebook Ads',
    amount: 28500,
    status: 'PENDING',
    issueDate: '2026-11-01',
    dueDate: '2026-11-15',
  },
  {
    id: 'INV-1003',
    clientName: 'NexGen Automobiles',
    campaignName: 'YouTube Pre-roll Ads Campaign',
    amount: 82000,
    status: 'PAID',
    issueDate: '2026-10-20',
    dueDate: '2026-11-05',
  },
  {
    id: 'INV-1004',
    clientName: 'Apex Fitness Club',
    campaignName: 'Local Billboard & Meta Ads',
    amount: 19500,
    status: 'OVERDUE',
    issueDate: '2026-10-10',
    dueDate: '2026-10-25',
  },
  {
    id: 'INV-1005',
    clientName: 'Skyline Real Estate',
    campaignName: 'Performance Max Ad Lead Gen',
    amount: 64000,
    status: 'PENDING',
    issueDate: '2026-11-04',
    dueDate: '2026-11-20',
  },
];

// Helper to calculate statistics
const calculateStats = () => {
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const totalClients = new Set(invoices.map((inv) => inv.clientName)).size;

  return {
    totalBilled,
    paidAmount,
    pendingAmount,
    totalClients,
    totalInvoices: invoices.length,
    paidCount: invoices.filter((i) => i.status === 'PAID').length,
    pendingCount: invoices.filter((i) => i.status === 'PENDING').length,
    overdueCount: invoices.filter((i) => i.status === 'OVERDUE').length,
  };
};

// Routes
// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Amazing Ads Billing Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 2. Summary stats
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: calculateStats(),
  });
});

// 3. Get all invoices (with optional query filter)
app.get('/api/invoices', (req, res) => {
  const { status, search } = req.query;
  let filtered = [...invoices];

  if (status && status !== 'ALL') {
    filtered = filtered.filter(
      (inv) => inv.status.toUpperCase() === String(status).toUpperCase()
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (inv) =>
        inv.clientName.toLowerCase().includes(q) ||
        inv.campaignName.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
});

// 4. Create new invoice
app.post('/api/invoices', (req, res) => {
  const { clientName, campaignName, amount, dueDate, status } = req.body;

  if (!clientName || !campaignName || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Client name, Campaign name, and Amount are required.',
    });
  }

  const newInvoice = {
    id: `INV-${1000 + invoices.length + 1}`,
    clientName: clientName.trim(),
    campaignName: campaignName.trim(),
    amount: Number(amount),
    status: status || 'PENDING',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  };

  invoices.unshift(newInvoice);

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    data: newInvoice,
  });
});

// 5. Update invoice status
app.patch('/api/invoices/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PAID', 'PENDING', 'OVERDUE'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: `Invoice with ID ${id} not found.`,
    });
  }

  invoice.status = status;

  res.json({
    success: true,
    message: 'Invoice status updated successfully',
    data: invoice,
  });
});

// 6. Delete invoice
app.delete('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = invoices.length;
  invoices = invoices.filter((inv) => inv.id !== id);

  if (invoices.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: `Invoice with ID ${id} not found.`,
    });
  }

  res.json({
    success: true,
    message: `Invoice ${id} deleted successfully`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Amazing Ads Billing Backend is running on http://localhost:${PORT}`);
  console.log(`📡 Accepting requests from ${CLIENT_ORIGIN}`);
});


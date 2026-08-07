// Main Server Entrypoint - Recached JSON projects
import './config/env.js';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import inquiryRouter from './routes/inquiry.js';
import adminRouter from './routes/admin.js';
import portfolioRouter from './routes/portfolio.js';
import uploadRouter from './routes/upload.js';
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize MongoDB Connection
connectDB();

// CORS configuration - Allow all origins for public portfolio chatbot
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure MongoDB connection for every request (Serverless friendly)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Health check endpoint
const handleHealth = (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

app.get('/api/health', handleHealth);
app.get('/health', handleHealth);
app.get('/api', (req, res) => res.json({ status: 'UP', message: 'Portfolio API Backend is running on Vercel Serverless!' }));

// Routes - Mounted both with /api/ and without /api/ for Vercel rewrite compatibility
app.use('/api/chat', chatRouter);
app.use('/chat', chatRouter);

app.use('/api/inquiries', inquiryRouter);
app.use('/inquiries', inquiryRouter);

app.use('/api/admin', adminRouter);
app.use('/admin', adminRouter);

app.use('/api/portfolio', portfolioRouter);
app.use('/portfolio', portfolioRouter);

app.use('/api/upload', uploadRouter);
app.use('/upload', uploadRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Export app for serverless deployment (Vercel)
export default app;

// Start Server locally if not running on Vercel Serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed frontend origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });
}



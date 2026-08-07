import express from 'express';
import { requireAdmin } from '../middlewares/authMiddleware.js';
import {
  getPortfolioData,
  updatePortfolioData,
  createProjectItem,
  deleteProjectItem
} from '../controllers/portfolioController.js';

const router = express.Router();

// Specific item-level endpoints for granular project management
router.post('/projects/item', requireAdmin, createProjectItem);
router.delete('/projects/item/:id', requireAdmin, deleteProjectItem);

// GET /api/portfolio/:type -> Publicly readable (projects, skills, history, about)
router.get('/:type', getPortfolioData);

// POST /api/portfolio/:type -> Admin only (bulk update for section)
router.post('/:type', requireAdmin, updatePortfolioData);

export default router;

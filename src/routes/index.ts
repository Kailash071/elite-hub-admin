import express, { type Request, type Response } from 'express';
import adminRoutes from './views.js';

const router = express.Router();

// Mount API routes
router.use('/', adminRoutes);

export default router;
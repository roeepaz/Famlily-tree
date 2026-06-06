import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route Imports
import profileRoutes from './routes/profileRoutes';
import postRoutes from './routes/postRoutes';
import heritageRoutes from './routes/heritageRoutes';
import eventRoutes from './routes/eventRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Standard Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Debug Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[API REQUEST] ${req.method} ${req.url} - IP: ${req.ip}`);
  const originalJson = res.json;
  res.json = function (body) {
    console.log(`[API RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode} - Body:`, JSON.stringify(body).slice(0, 200));
    return originalJson.call(this, body);
  };
  next();
});

// Health Check Route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Mount Routes
app.use('/api/profiles', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/heritage', heritageRoutes);
app.use('/api/events', eventRoutes);

// 404 Route handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handling Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`  Kinship API Server is running on port ${PORT}`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=============================================`);
  });
}

export default app;

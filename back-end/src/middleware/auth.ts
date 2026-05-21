import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, supabase } from '../config/supabase';
import { Profile } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: Profile;
}

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let userId: string | null = null;

    // 1. Check for x-user-id header (very useful for development/testing)
    const devUserId = req.headers['x-user-id'];
    if (typeof devUserId === 'string' && devUserId.trim() !== '') {
      userId = devUserId;
    }

    // 2. Check for Authorization header (Supabase standard token)
    const authHeader = req.headers.authorization;
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          userId = decoded.sub || null;
        } catch (err) {
          console.warn('JWT verification failed locally:', err);
        }
      }

      // If local JWT check didn't resolve and Supabase client exists, verify with Supabase Auth
      if (!userId && supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid credentials' });
      return;
    }

    // 3. Retrieve user profile
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      res.status(403).json({ 
        error: 'Profile not found', 
        type: 'user_not_registered',
        userId 
      });
      return;
    }

    req.user = profile;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
}

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
      console.log('[Auth Debug] Authenticated via x-user-id header:', userId);
    }

    // 2. Check for Authorization header (Supabase standard token)
    const authHeader = req.headers.authorization;
    console.log('[Auth Debug] Incoming authHeader present:', !!authHeader);
    
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('[Auth Debug] Token present (length):', token ? token.length : 0);
      console.log('[Auth Debug] SUPABASE_JWT_SECRET environment variable is configured:', !!JWT_SECRET);

      if (JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          userId = decoded.sub || null;
          console.log('[Auth Debug] JWT verified successfully locally, userId:', userId);
        } catch (err: any) {
          console.warn('[Auth Debug] JWT verification failed locally:', err.message || err);
        }
      } else {
        console.warn('[Auth Debug] Missing SUPABASE_JWT_SECRET in backend environment variables.');
      }

      // If local JWT check didn't resolve and Supabase client exists, verify with Supabase Auth
      console.log('[Auth Debug] Supabase client exists (configured):', !!supabase);
      if (!userId && supabase) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (error) {
            console.warn('[Auth Debug] Supabase auth.getUser returned error:', error.message || error);
          } else if (user) {
            userId = user.id;
            console.log('[Auth Debug] Verified token via Supabase Auth API, userId:', userId);
          } else {
            console.warn('[Auth Debug] Supabase auth.getUser returned empty user and no error.');
          }
        } catch (err: any) {
          console.error('[Auth Debug] Exception while calling supabase.auth.getUser:', err.message || err);
        }
      }
    }

    if (!userId) {
      console.warn('[Auth Debug] Rejecting request: userId is unresolved (Missing or invalid credentials).');
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

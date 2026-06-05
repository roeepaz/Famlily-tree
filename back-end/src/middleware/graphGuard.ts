import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/supabase';

export interface AuthenticatedUserRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
    treeId?: string | null;
    [key: string]: any;
  };
}

export async function verifyGraphAccessAuthorization(
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    const targetResourceId = req.params.id; 

    if (!viewerId) {
      return res.status(401).json({ error: "Missing authentication session context credentials" });
    }

    const targetResource = await prisma.post.findUnique({
      where: { id: targetResourceId },
      select: { treeId: true, authorId: true, visibilityScope: true }
    });

    if (!targetResource) {
      return res.status(404).json({ error: "The targeted resource record does not exist within this system" });
    }

    if (targetResource.treeId !== req.user?.treeId) {
      return res.status(403).json({ error: "Access Denied: Tenant boundary cross-contamination intercepted" });
    }

    if (targetResource.visibilityScope === 'CORE_CIRCLE') {
      const inferredCircle: any[] = await prisma.$queryRaw`
        SELECT * FROM public.calculate_inferred_network(${viewerId}::uuid, 1)
        WHERE target_profile_id = ${targetResource.authorId}::uuid
      `;
      if (inferredCircle.length === 0 && targetResource.authorId !== viewerId) {
        return res.status(403).json({ error: "Access Denied: Resource is locked to Immediate Core Circle nodes only" });
      }
    }

    return next();
  } catch (error) {
    console.error('Error in verifyGraphAccessAuthorization:', error);
    return res.status(500).json({ error: "Internal algorithmic system evaluation failure encountered" });
  }
}

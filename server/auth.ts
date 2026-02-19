import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    if (typeof decoded === 'string') {
      return res.status(403).json({ error: 'Invalid token format' });
    }
    
    req.user = {
      id: decoded.id as string,
      username: decoded.username as string
    };
    next();
  });
}

export function generateToken(userId: string, username: string): string {
  return jwt.sign(
    { id: userId, username },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

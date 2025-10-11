import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// JWT Configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "your_access_secret_here";

interface AuthPayload extends JwtPayload {
  userId: string;
  type: 'access' | 'refresh';
  role?: string;
  permissions?: Record<string, Record<string, boolean>>;
}

interface UserPayload extends AuthPayload {
  id?: string;
  email?: string;
}

// Enhanced authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
     res.status(401).json({
      error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required - missing authorization header" }
    });
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: { code: "INVALID_AUTH_FORMAT", message: "Invalid authorization format - expected Bearer token" }
    });
    return;
  }

  const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix and trim

  if (!token || token.length < 10) {
    res.status(401).json({
      error: { code: "INVALID_TOKEN_FORMAT", message: "Invalid token format - token too short" }
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;

    // Ensure it's an access token
    if (decoded.type !== 'access') {
      res.status(401).json({
        error: { code: "INVALID_TOKEN_TYPE", message: "Invalid token type" }
      });
      return;
    }

    (req as any).user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        error: {
          code: "TOKEN_EXPIRED",
          message: "Access token expired",
          expiredAt: err.expiredAt
        }
      });
      return;
    }

    res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Invalid access token" }
    });
    return;
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();

    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;
      if (decoded.type === 'access') {
        (req as any).user = decoded;
      }
    } catch (err) {
      // Ignore token errors in optional auth
    }
  }

  next();
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as UserPayload;

    if (!user) {
      res.status(401).json({
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" }
      });
      return;
    }

    if (!user.role || !roles.includes(user.role)) {
        res.status(403).json({
        error: { code: "ACCESS_DENIED", message: "Insufficient role permissions" }
      });
      return;
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as UserPayload;

    if (!user) {
      res.status(401).json({
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" }
      });
      return;
    }

    // Super admin bypass
    if (user.role === 'superadmin') {
      return next();
    }

    const userPermissions = user.permissions || {};
    if (userPermissions[module]?.[action] !== true) {
      res.status(403).json({
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: `Permission required: ${module}:${action}`
        }
      });
      return;
    }

    next();
  };
};

// Export both names for compatibility
export { authenticate };
export { authenticate as authMiddleware };

import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
interface AuthPayload extends JwtPayload {
  id?: string;
  email?: string;
  role?: string;
    date: Date;

}
type UserPayload = AuthPayload ;

// توثيق الدخول
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("authenticate: token =", token);

  if (!token) {
res.status(401).json({ message: "Unauthorized" });
    return;
  } 

  try {
const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    
(req as any).user = decoded as UserPayload;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// التحقق من الدور
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
       res.status(403).json({ message: "Access denied" });
       return;
    }
    next();
  };
};

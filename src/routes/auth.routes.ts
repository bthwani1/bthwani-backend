// src/routes/auth.routes.ts
import { Router } from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth.middleware";
import { User } from "../models/user";

const router = Router();

// JWT Refresh Token endpoint with rotation and blacklist
router.post(
  "/refresh",
  [
    body("refreshToken").isString().notEmpty()
  ],
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
         res.status(401).json({
          error: { code: "REFRESH_TOKEN_REQUIRED", message: "Refresh token is required" }
        });
        return;
      }

      if (!refreshToken) {
         res.status(401).json({
          error: { code: "REFRESH_TOKEN_REQUIRED", message: "Refresh token is required" }
        });
        return;
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      } catch (error) {
        return res.status(401).json({
          error: { code: "INVALID_REFRESH_TOKEN", message: "Invalid refresh token" }
        });
      }

      // Check if token is blacklisted (implement blacklist logic)
      const isBlacklisted = await checkTokenBlacklist(refreshToken);
      if (isBlacklisted) {
        return res.status(401).json({
          error: { code: "BLACKLISTED_TOKEN", message: "Token has been blacklisted" }
        });
      }

      // Get user from database
      const user = await User.findById(decoded.userId).lean();
      if (!user) {
        return res.status(401).json({
          error: { code: "USER_NOT_FOUND", message: "User not found" }
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: { code: "USER_INACTIVE", message: "User account is inactive" }
        });
      }

      // Generate new token pair
      const newAccessToken = generateAccessToken(user._id.toString());
      const newRefreshToken = generateRefreshToken(user._id.toString());

      // Blacklist the old refresh token
      await blacklistToken(refreshToken, decoded.exp);

      // Store new refresh token (implement storage logic)
      await storeRefreshToken(user._id.toString(), newRefreshToken);

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to refresh token" }
      });
    }
  }
);

// Logout endpoint - blacklist tokens
router.post(
  "/logout",
  authMiddleware, // Requires valid access token
  async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const refreshToken = req.body.refreshToken;

      if (accessToken) {
        // Extract expiry from token
        const decoded = jwt.decode(accessToken) as any;
        if (decoded?.exp) {
          await blacklistToken(accessToken, decoded.exp);
        }
      }

      if (refreshToken) {
        const decoded = jwt.decode(refreshToken) as any;
        if (decoded?.exp) {
          await blacklistToken(refreshToken, decoded.exp);
        }
      }

      res.json({ message: "Logged out successfully" });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to logout" }
      });
    }
  }
);

// Helper functions (implement these based on your storage preference)
async function checkTokenBlacklist(token: string): Promise<boolean> {
  // Implement Redis/in-memory blacklist check
  // For now, return false (not blacklisted)
  return false;
}

async function blacklistToken(token: string, expiry: number): Promise<void> {
  // Implement token blacklisting logic
  // Store token hash with expiry in Redis/database
  const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
  // Store in Redis with expiry timestamp
  // await redis.setex(`blacklist:${tokenHash}`, expiry - Math.floor(Date.now() / 1000), '1');
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  // Store refresh token for user (implement based on your storage preference)
  // await User.findByIdAndUpdate(userId, { refreshToken: token });
}

function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' } as jwt.SignOptions
  );
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' } as jwt.SignOptions
  );
}

export default router;

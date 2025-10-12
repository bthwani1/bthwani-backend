// middleware/ensureOwner.ts
import { Request, Response, NextFunction } from "express";

// Generic resource ownership middleware
export async function ensureOwner(
  req: Request,
  res: Response,
  next: NextFunction,
  resourceType?: string,
  ownerField = 'userId'
) {
  try {
    const resourceId = req.params.id || req.params.resourceId;

    if (!resourceId) {
       res.status(400).json({
        error: { code: "MISSING_RESOURCE_ID", message: "Resource ID is required" }
      });
      return;
    }

    if (!req.user?.uid) {
         res.status(401).json({
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" }
      });
      return;
    }

    // Import models dynamically to avoid circular dependencies
    const modelMap: { [key: string]: any } = {
      'Order': () => import("../models/delivery_marketplace_v1/Order"),
      'Store': () => import("../models/delivery_marketplace_v1/DeliveryStore"),
      'SupportTicket': () => import("../models/support/SupportTicket"),
      'User': () => import("../models/user"),
      'Driver': () => import("../models/Driver_app/driver"),
      'Vendor': () => import("../models/vendor_app/Vendor"),
      'Wallet': () => import("../models/Wallet_V8/wallet.model"),
    };

    if (resourceType && modelMap[resourceType]) {
      const modelModule = await modelMap[resourceType]();
      const Model = modelModule.default;

      const resource = await Model.findById(resourceId).lean();

      if (!resource) {
         res.status(404).json({
          error: { code: "RESOURCE_NOT_FOUND", message: "Resource not found" }
        });
        return;
      }

      // Check ownership - flexible field matching
      const resourceOwnerId = resource[ownerField] || resource.userId || resource.ownerId || resource.driverId;

      if (resourceOwnerId !== req.user.uid) {
         res.status(403).json({
          error: { code: "ACCESS_DENIED", message: "You don't have permission to access this resource" }
        });
        return;
      }

      // Attach resource to request for use in controller
      (req as any).resource = resource;
    }

    next();
  } catch (error) {
    console.error('ensureOwner error:', error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Error checking resource ownership" }
    });
  }
}

// Convenience functions for common resource types
export const ensureOrderOwner = (req: Request, res: Response, next: NextFunction) =>
  ensureOwner(req, res, next, 'Order');

export const ensureStoreOwner = (req: Request, res: Response, next: NextFunction) =>
  ensureOwner(req, res, next, 'Store', 'ownerId');

export const ensureTicketOwner = (req: Request, res: Response, next: NextFunction) =>
  ensureOwner(req, res, next, 'SupportTicket');

export const ensureUserOwner = (req: Request, res: Response, next: NextFunction) =>
  ensureOwner(req, res, next, 'User');

// Admin override - allows admin to access any resource
export async function ensureOwnerOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
  resourceType?: string,
  ownerField = 'userId'
) {
  try {
    // Check if user is admin first
    if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
      next();
      return;
    }

    // If not admin, check ownership
    ensureOwner(req, res, next, resourceType, ownerField);
    return;
  } catch (error) {
    console.error('ensureOwnerOrAdmin error:', error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Error checking access" }
    });
  }
}

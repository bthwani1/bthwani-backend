import { Request, Response, NextFunction } from 'express';

// Finance-specific roles and permissions
export enum FinanceRole {
  FINANCE_ADMIN = 'FinanceAdmin',
  OPS = 'Ops',
  DRIVER = 'Driver',
  VENDOR = 'Vendor',
  AUDITOR = 'Auditor'
}

export enum FinancePermission {
  // Settlement permissions
  CREATE_SETTLEMENT = 'finance:settlement:create',
  READ_SETTLEMENT = 'finance:settlement:read',
  UPDATE_SETTLEMENT = 'finance:settlement:update',
  DELETE_SETTLEMENT = 'finance:settlement:delete',
  MARK_SETTLEMENT_PAID = 'finance:settlement:mark_paid',
  EXPORT_SETTLEMENT = 'finance:settlement:export',

  // Payout permissions
  CREATE_PAYOUT = 'finance:payout:create',
  READ_PAYOUT = 'finance:payout:read',
  UPDATE_PAYOUT = 'finance:payout:update',
  PROCESS_PAYOUT = 'finance:payout:process',
  EXPORT_PAYOUT = 'finance:payout:export',

  // Wallet permissions
  READ_OWN_WALLET = 'finance:wallet:read_own',
  READ_ALL_WALLETS = 'finance:wallet:read_all',
  UPDATE_WALLET = 'finance:wallet:update',
  EXPORT_WALLET_STATEMENT = 'finance:wallet:export_statement',

  // Commission permissions
  CREATE_COMMISSION_RULE = 'finance:commission:create_rule',
  READ_COMMISSION_RULE = 'finance:commission:read_rule',
  UPDATE_COMMISSION_RULE = 'finance:commission:update_rule',
  DELETE_COMMISSION_RULE = 'finance:commission:delete_rule',
  CALCULATE_COMMISSION = 'finance:commission:calculate',

  // Report permissions
  READ_REPORTS = 'finance:reports:read',
  GENERATE_REPORTS = 'finance:reports:generate',
  EXPORT_REPORTS = 'finance:reports:export',

  // Ledger permissions
  READ_LEDGER = 'finance:ledger:read',
  CREATE_LEDGER_ENTRY = 'finance:ledger:create',
  UPDATE_LEDGER_ENTRY = 'finance:ledger:update',

  // Reconciliation permissions
  READ_RECONCILIATION = 'finance:reconciliation:read',
  VALIDATE_BALANCE = 'finance:reconciliation:validate'
}

// Role-based permissions mapping
const rolePermissions: Record<FinanceRole, FinancePermission[]> = {
  [FinanceRole.FINANCE_ADMIN]: [
    // Full access to all finance operations
    ...Object.values(FinancePermission)
  ],
  [FinanceRole.OPS]: [
    FinancePermission.READ_SETTLEMENT,
    FinancePermission.UPDATE_SETTLEMENT,
    FinancePermission.MARK_SETTLEMENT_PAID,
    FinancePermission.EXPORT_SETTLEMENT,
    FinancePermission.CREATE_PAYOUT,
    FinancePermission.READ_PAYOUT,
    FinancePermission.UPDATE_PAYOUT,
    FinancePermission.PROCESS_PAYOUT,
    FinancePermission.EXPORT_PAYOUT,
    FinancePermission.READ_ALL_WALLETS,
    FinancePermission.EXPORT_WALLET_STATEMENT,
    FinancePermission.READ_LEDGER,
    FinancePermission.READ_RECONCILIATION,
    FinancePermission.READ_REPORTS,
    FinancePermission.EXPORT_REPORTS
  ],
  [FinanceRole.DRIVER]: [
    FinancePermission.READ_OWN_WALLET,
    FinancePermission.EXPORT_WALLET_STATEMENT
  ],
  [FinanceRole.VENDOR]: [
    FinancePermission.READ_OWN_WALLET,
    FinancePermission.EXPORT_WALLET_STATEMENT
  ],
  [FinanceRole.AUDITOR]: [
    FinancePermission.READ_SETTLEMENT,
    FinancePermission.READ_PAYOUT,
    FinancePermission.READ_ALL_WALLETS,
    FinancePermission.READ_LEDGER,
    FinancePermission.READ_RECONCILIATION,
    FinancePermission.READ_REPORTS,
    FinancePermission.EXPORT_REPORTS,
    FinancePermission.EXPORT_WALLET_STATEMENT,
    FinancePermission.VALIDATE_BALANCE
  ]
};

/**
 * Check if user has required finance permission
 */
export function hasFinancePermission(user: any, permission: FinancePermission): boolean {
  if (!user || !user.role) return false;

  // Check if user has specific finance role
  const financeRole = user.financeRole as FinanceRole;
  if (!financeRole) return false;

  const permissions = rolePermissions[financeRole] || [];
  return permissions.includes(permission);
}

/**
 * Middleware to check finance permissions
 */
export function financePermissionMiddleware(permission: FinancePermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    if (!hasFinancePermission(user, permission)) {
       res.status(403).json({
        message: 'ليس لديك صلاحية للوصول إلى هذه الميزة',
        error: {
          code: 'INSUFFICIENT_FINANCE_PERMISSIONS',
          required: [permission],
          user_role: user?.financeRole
        }
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user can access own wallet only
 */
export function ownWalletOnlyMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const accountId = req.params.accountId || req.query.accountId;

    if (!accountId) {
       next();
       return;
    }

    // If user is driver or vendor, they can only access their own wallet
    if ([FinanceRole.DRIVER, FinanceRole.VENDOR].includes(user?.financeRole)) {
      const userAccountId = user?.walletAccountId;

      if (accountId !== userAccountId) {
         res.status(403).json({
          message: 'يمكنك الوصول إلى محفظتك الخاصة فقط',
          error: {
            code: 'WALLET_ACCESS_DENIED',
            requested_account: accountId,
            user_account: userAccountId
          }
        });
        return;
      }
    }

    next();
  };
}

/**
 * Middleware to check multiple finance permissions
 */
export function financePermissionsMiddleware(permissions: FinancePermission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    const hasAnyPermission = permissions.some(permission =>
      hasFinancePermission(user, permission)
    );

    if (!hasAnyPermission) {
       res.status(403).json({
        message: 'ليس لديك صلاحية للوصول إلى هذه الميزة',
        error: {
          code: 'INSUFFICIENT_FINANCE_PERMISSIONS',
          required: permissions,
          user_role: user?.financeRole
        }
      });
      return;
    }

    next();
  };
}

/**
 * Helper function to get user's finance permissions
 */
export function getUserFinancePermissions(user: any): FinancePermission[] {
  if (!user || !user.financeRole) return [];

  return rolePermissions[user.financeRole] || [];
}

/**
 * Middleware for deep link protection - return 404 for unauthorized access
 */
export function financeDeepLinkProtection(permission: FinancePermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    if (!hasFinancePermission(user, permission)) {
       res.status(404).json({
        message: 'الصفحة غير موجودة',
        error: {
          code: 'PAGE_NOT_FOUND'
        }
      });
      return;
      }

    next();
  };
}

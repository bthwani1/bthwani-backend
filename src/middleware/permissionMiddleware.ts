import { Request, Response, NextFunction } from 'express';

/**
 * authorize: يتحقق أن المستخدم يملك صلاحية معينة (action)
 * على قسم/module محدد
 *
 * @param moduleName اسم القسم (مثلاً 'delivery' أو 'hr')
 * @param action اسم الصلاحية (مثلاً 'view' أو 'edit')
 */
export function authorize(
  moduleName: string,
  action: keyof Record<string, boolean>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
       res.status(401).json({ message: 'Unauthorized' });
       return;
    }

    const modulePerms = user.permissions?.[moduleName];
    if (!modulePerms || modulePerms[action] !== true) {
       res.status(403).json({ message: 'Forbidden: insufficient rights' });
       return;
    }

    next();
  };
}

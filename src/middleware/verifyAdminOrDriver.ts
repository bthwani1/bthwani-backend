// middleware/verifyAdminOrDriver.ts
export const verifyAdminOrDriver = (req: any, res: any, next: any) => {
  const role = req.user?.role;
  if (role === "admin" || role === "driver" || role === "superadmin") {
    return next();
  }
  return res.status(403).json({ message: "غير مصرح لك" });
};

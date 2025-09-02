import jwt from "jsonwebtoken";

export function verifyVendorJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
     res.status(401).json({ message: "No token provided" });
     return;
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
     res.status(401).json({ message: "Invalid token" });
     return;
  }
}

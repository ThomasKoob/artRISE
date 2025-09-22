import jwt from "jsonwebtoken";

const auth = (req, res, next) => {

  const cookieToken = req.cookies?.token;
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = cookieToken || bearer;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   
    req.user = {
      _id: decoded._id || decoded.id,
      role: decoded.role || "buyer",
    };
    return next();
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError" ? "Token expired" : "Unauthorized";
    return res.status(401).json({ error: msg });
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };

export default auth;

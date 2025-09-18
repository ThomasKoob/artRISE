export default function errorHandler(err, _req, res, _next) {
  console.error("Error:", err);
  const status = err?.status || err?.cause || 500;
  res.status(status).json({ message: err?.message || "Server Error" });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: error.message || "Server error",
  });
}

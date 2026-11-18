
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    errorCode: 'ERR_ENDPOINT_NOT_FOUND',
    message: `Không tìm thấy API: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
};

module.exports = notFound;

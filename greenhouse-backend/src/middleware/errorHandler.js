
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    code: status,
    errorCode: 'ERR_INTERNAL_SERVER',
    message: status === 500 ? 'Đã xảy ra lỗi từ máy chủ.' : err.message,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;

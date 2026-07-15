/**
 * 统一响应格式
 */
const successResponse = (data = null, message = 'success') => ({
  code: 200,
  message,
  data
});

const errorResponse = (message = 'error', code = 400) => ({
  code,
  message,
  data: null
});

module.exports = {
  successResponse,
  errorResponse
};
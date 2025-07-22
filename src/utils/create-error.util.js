export default function createError(statusCode, msg) {
  const error = new Error(msg);
  error.statusCode = statusCode;
  // console.log(error)
  throw error;
}
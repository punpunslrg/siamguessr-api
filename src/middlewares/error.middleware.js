export default function errorMiddleware (err, req, res, next) {
  console.log(err)
  // err.statusCode = 500
  res.status(err.statusCode).json({
    errorName: err.name,
    errorMsg: err.message
  })
}
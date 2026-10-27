export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function sendData(res, data, status = 200) {
  return res.status(status).json({ success: true, data })
}

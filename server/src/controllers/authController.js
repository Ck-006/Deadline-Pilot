import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { cookieOptions, issueToken } from '../middleware/auth.js'
import { AppError, sendData } from '../utils.js'
import { loginSchema, registerSchema } from '../validators/schemas.js'

function parse(schema, body) {
  const result = schema.safeParse(body)
  if (!result.success) throw new AppError(400, 'VALIDATION_ERROR', 'Check the highlighted fields and try again.', result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })))
  return result.data
}

function publicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email }
}

export async function register(req, res) {
  const input = parse(registerSchema, req.body)
  if (await User.exists({ email: input.email })) throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists.')
  const passwordHash = await bcrypt.hash(input.password, 12)
  let user
  try {
    user = await User.create({ name: input.name, email: input.email, passwordHash })
  } catch (error) {
    if (error?.code === 11000) throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists.')
    throw error
  }
  res.cookie('deadlinepilot_token', issueToken(user), cookieOptions())
  return sendData(res, { user: publicUser(user) }, 201)
}

export async function login(req, res) {
  const input = parse(loginSchema, req.body)
  const user = await User.findOne({ email: input.email }).select('+passwordHash')
  const validPassword = user ? await bcrypt.compare(input.password, user.passwordHash) : false
  if (!validPassword) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
  res.cookie('deadlinepilot_token', issueToken(user), cookieOptions())
  return sendData(res, { user: publicUser(user) })
}

export function logout(_req, res) {
  res.clearCookie('deadlinepilot_token', { ...cookieOptions(), maxAge: undefined })
  return sendData(res, { message: 'Signed out successfully.' })
}

export function me(req, res) {
  return sendData(res, { user: publicUser(req.user) })
}

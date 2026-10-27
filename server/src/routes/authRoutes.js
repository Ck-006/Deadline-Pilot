import { Router } from 'express'
import { login, logout, me, register } from '../controllers/authController.js'
import { requireAuth, requireJwtSecret } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { authLimiter } from '../middleware/rateLimits.js'

const router = Router()
router.post('/register', requireDatabase, requireJwtSecret, authLimiter, register)
router.post('/login', requireDatabase, requireJwtSecret, authLimiter, login)
router.post('/logout', logout)
router.get('/me', requireDatabase, requireAuth, me)
export default router

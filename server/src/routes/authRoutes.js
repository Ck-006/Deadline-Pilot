import { Router } from 'express'
import { login, logout, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { authLimiter } from '../middleware/rateLimits.js'

const router = Router()
router.post('/register', requireDatabase, authLimiter, register)
router.post('/login', requireDatabase, authLimiter, login)
router.post('/logout', logout)
router.get('/me', requireDatabase, requireAuth, me)
export default router

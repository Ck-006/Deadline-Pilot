import { Router } from 'express'
import { createAssignment, dashboard, deleteAssignment, getAssignment, listAssignments, updateAssignment } from '../controllers/assignmentController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/dashboard', dashboard)
router.route('/').get(listAssignments).post(createAssignment)
router.route('/:id').get(getAssignment).patch(updateAssignment).delete(deleteAssignment)
export default router

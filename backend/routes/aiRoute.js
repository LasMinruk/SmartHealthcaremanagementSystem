import express from 'express'
import { triage } from '../controllers/aiController.js'

const aiRouter = express.Router()

aiRouter.post('/triage', triage)

export default aiRouter



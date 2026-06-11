require('dotenv').config()
const express = require('express')
const cors = require('cors')
const supabase = require('./src/utils/supabase')
const authRoutes = require('./src/routes/auth')
const onboardingRoutes = require('./src/routes/onboarding')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/onboarding', onboardingRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'FELT backend is running' })
})

supabase.auth.getSession().then(() => {
  console.log('Supabase connected successfully')
}).catch((err) => {
  console.log('Supabase connection failed:', err.message)
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`FELT backend running on port ${PORT}`)
})
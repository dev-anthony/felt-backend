const express = require('express')
const cors = require('cors')

const authRoute = require('./routes/auth.route')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

// Routes
app.use('/api/auth', authRoute)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'FELT backend is running' })
})

module.exports = app
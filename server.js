require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const supabase = require('./src/utils/supabase')
const authRoutes = require('./src/routes/auth')
const onboardingRoutes = require('./src/routes/onboarding')
const userRoutes = require('./src/routes/user')
const uploadRoutes = require('./src/routes/uploads')
const generationRoutes = require('./src/routes/generation')
const emotionRoutes = require('./src/routes/emotions')

const app = express()
// app.enable('trust proxy')
// const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000', 
//   'http://localhost:3000']
// app.use(cors({ origin: allowedOrigins, credentials: true }))
// app.use(express.json())
// app.use(cookieParser())
app.enable('trust proxy');

const allowedOrigins = [
  'http://localhost:3000',
  'https://usefelt.online',
  'https://www.usefelt.online',
  'https://felt-rouge-six.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 12mb, not the 100kb default: a base64-encoded reference image (Task 4)
// can run several MB even after client-side resizing. Every other route
// still goes through this same parser -- raising it here is simpler and
// safer than duplicating express.json() per-route, since the global
// parser runs before any route-specific one could anyway.
app.use(express.json({ limit: '12mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/onboarding', onboardingRoutes)
app.use('/api/user', userRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/generations', generationRoutes)
app.use('/api/emotions', emotionRoutes)

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
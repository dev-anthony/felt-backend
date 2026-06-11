const COOKIE_CONFIG = {
  httpOnly: true,                 
  secure: process.env.NODE_ENV === 'production', 
  sameSite: 'lax',                
  path: '/',                      
  maxAge: 30 * 24 * 60 * 60 * 1000 
}

exports.COOKIE_CONFIG = COOKIE_CONFIG
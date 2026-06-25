
const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_CONFIG = {
  httpOnly: true,                 
  secure: isProduction, 
  
 
  
  sameSite: isProduction ? 'none' : 'lax',        
  
  path: '/',                      
  maxAge: 30 * 24 * 60 * 60 * 1000 
};

exports.COOKIE_CONFIG = COOKIE_CONFIG;
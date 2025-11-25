module.exports = (req, res) => {
  res.json({
    vercel: !!process.env.VERCEL,
    mongoUriSet: !!process.env.MONGO_URI,
    jwtSecretSet: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('MONGO') || key.includes('JWT') || key.includes('PORT')
    )
  });
};
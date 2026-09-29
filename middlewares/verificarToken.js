import jwt from 'jsonwebtoken'

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token requerido'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const datos = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    req.usuario = datos

    next()
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido'
    })
  }
}

export default verificarToken
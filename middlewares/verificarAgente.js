const verificarAgente = (req, res, next) => {
  if (req.usuario.rol !== 'agente') {
    return res.status(403).json({
      error: 'Acceso exclusivo para agentes'
    })
  }

  next()
}

export default verificarAgente
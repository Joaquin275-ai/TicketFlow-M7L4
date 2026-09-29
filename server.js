import 'dotenv/config'
import express from 'express'
import supabase from './config/supabaseClient.js'
import authRoutes from './routes/auth.routes.js'
import ticketsRoutes from './routes/tickets.routes.js'

const app = express()

app.use(express.json())

app.use(express.static('public'))

app.use('/auth', authRoutes)
app.use('/tickets', ticketsRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, async () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`)

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1)

  if (error) {
    console.log('❌ Error conectando con Supabase:')
    console.log(error.message)
  } else {
    console.log('✅ Supabase conectado correctamente')
    console.log('Usuarios encontrados:', data)
  }
})
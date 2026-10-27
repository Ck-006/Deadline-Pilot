import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/db.js'

const port = Number(process.env.PORT) || 5000
connectDatabase().catch((error) => {
  console.error(`MongoDB connection failed (${error.name || 'connection error'}). Check MONGODB_URI and Atlas network access.`)
})

app.listen(port, () => console.info(`DeadlinePilot API listening on port ${port}.`))

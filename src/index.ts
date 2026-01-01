import { validateEnvironment, env } from "./config/env.js"
import { Database } from "./config/database.js"
import {
  createExpressApp,
  setupErrorHandling,
  setupGracefulShutdown,
} from "./config/express.js"
import routes from "./routes/index.js"
import runMainDefaultInitialize from "./constant/runDefaultData.js"
/**
 * Electronic Admin Server
 * Node.js TypeScript application with Express and database connectivity
 */

async function startServer(): Promise<void> {
  try {
    console.log("🔧 Validating environment configuration...")
    validateEnvironment()

    console.log("🗄️  Initializing database connections...")
    await Database.initialize()

    // Ensure all mongoose models are registered before using them
    await import("./models/index.js")

    console.log("⚡ Setting up Express application...")
    const app = createExpressApp()

    app.use(routes)
    // default data load
    await runMainDefaultInitialize()

    setupErrorHandling(app)

    const server = app.listen(env.NODE_PORT, () => {
      const serverUrl = `http://localhost:${env.NODE_PORT}`
      console.log("🎉 ================================")
      console.log("🚀 Electronic Admin Server Started!")
      console.log("🎉 ================================")
      console.log(`📍 Server: ${serverUrl}`)
      console.log(`🏥 Health Check: ${serverUrl}/health`)
      console.log(`🌍 Environment: ${env.NODE_ENV}`)
      console.log(`📱 App: ${env.APP_NAME}`)
      console.log(`⚙️  Configured BASE_URL: ${env.BASE_URL}`)
      console.log("🎉 ================================")
    })

    // 8. Setup graceful shutdown
    setupGracefulShutdown(server)

    // 9. Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
      // Close server gracefully
      server.close(() => {
        process.exit(1)
      })
    })

    // 10. Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      console.error("❌ Uncaught Exception:", error)
      // Close server gracefully
      server.close(() => {
        process.exit(1)
      })
    })
  } catch (error) {
    console.error("❌ Failed to start server:", error)

    // Try to close database connections if they were opened
    try {
      await Database.shutdown()
    } catch (shutdownError) {
      console.error("❌ Error during emergency shutdown:", shutdownError)
    }

    process.exit(1)
  }
}

// Start the server
console.log("🎯 Starting Electronic Admin Server...")
startServer().catch((error: Error) => {
  console.error("❌ Server startup failed:", error)
  process.exit(1)
})

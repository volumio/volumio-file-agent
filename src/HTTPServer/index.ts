import { Agent } from '@Agent'
import { json as jsonBodyParser } from 'body-parser'
import express, { ErrorRequestHandler } from 'express'
import http, { Server } from 'http'
import onFinished from 'on-finished'
import now from 'performance-now'

import { debug } from './debug'
import { buildOpenApiBackend, OpenApiBackendMiddleware } from './OpenApiBackend'

export const HTTPServer = async ({ agent }: Configuration): Promise<Server> => {
  const app = express()

  const server = http.createServer(app)

  server.on('listening', () => {
    if (debug.info.enabled) {
      const address = server.address()
      if (typeof address === 'string') {
        debug.info(`Server listening on address %s`, address)
      } else if (address !== null) {
        debug.info(`Server listening on %s:%d`, address.address, address.port)
      }
    }
  })

  server.on('close', () => {
    if (debug.info.enabled) {
      debug.info(`Server closed`)
    }
  })

  server.on('error', (error) => {
    if (debug.error.enabled) {
      debug.error(`Server error: %s`, error.message)
    }
  })

  if (debug.info.enabled) {
    /**
     * Wrap req-res cycle execution to be
     * able to log Response outcome informations
     */
    app.use((req, res, next) => {
      const start = now()

      onFinished(res, function (_, res) {
        const duration = now() - start
        debug.info(
          `[%d] %d ms: %s %s`,
          res.statusCode,
          duration.toFixed(2),
          req.method.toUpperCase(),
          req.path,
        )
      })

      next()
    })
  }

  /**
   * Wire in the OpenApi backend
   *
   * The middleware decides whether to terminate the req-res cycle,
   * or to call `next()`
   */
  const openApiBackend = await buildOpenApiBackend({ agent })
  app.use(
    jsonBodyParser(),
    OpenApiBackendMiddleware({ backend: openApiBackend }),
  )

  /**
   * Catch eventual error to prevent bubbling up
   */
  const errorHandler: ErrorRequestHandler = (error, _, res, __) => {
    debug.error.enabled &&
      debug.error(`[CAUGHT ERROR] %s: %s`, error.name, error.message)

    res.status(500).send({
      success: false,
      error: {
        message: error.message,
      },
    })
  }
  app.use(errorHandler)

  return server
}

interface Configuration {
  agent: Agent
}

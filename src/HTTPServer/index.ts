import { Agent } from '@Agent'
import { json as jsonBodyParser } from 'body-parser'
import express, { ErrorRequestHandler } from 'express'
import http, { Server } from 'http'
import onFinished from 'on-finished'
import now from 'performance-now'

import { debug } from './debug'
import { AddMountPointHandler } from './handlers/addMountPoint'
import { GetMountPointHandler } from './handlers/getMountPoint'
import { GetStatsHandler } from './handlers/getStats'

export const HTTPServer = ({ agent }: Configuration): Server => {
  const app = express()

  if (debug.info.enabled) {
    app.use((req, res, next) => {
      const start = now()

      onFinished(res, function (_, res) {
        const duration = now() - start
        debug.info(
          `[%d] %s %s - %d ms`,
          res.statusCode,
          req.method.toUpperCase(),
          req.path,
          duration,
        )
      })
      next()
    })
  }

  app.get('/healthz', (_, res) => {
    res.sendStatus(200)
  })

  app.get('/stats', GetStatsHandler({ agent }))

  app.get('/mountpoint', GetMountPointHandler({ agent }))

  app.post('/mountpoints', jsonBodyParser(), AddMountPointHandler({ agent }))

  const errorHandler: ErrorRequestHandler = (error, _, res, __) => {
    res.status(500).send({
      error: {
        message: error.message,
      },
    })
  }

  app.use(errorHandler)

  const server = http.createServer(app)

  server.on('listening', () => {
    if (debug.info.enabled) {
      const address = server.address()
      if (typeof address === 'string') {
        debug.info(`Server listening on address %s`, address)
      } else if (address !== null) {
        debug.info(`Server listening on port %d`, address.port)
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

  return server
}

interface Configuration {
  agent: Agent
}

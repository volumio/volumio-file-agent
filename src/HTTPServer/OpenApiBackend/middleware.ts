import { RequestHandler } from 'express'

import { Backend } from '.'

export const OpenApiBackendMiddleware = ({
  backend,
}: Dependencies): RequestHandler => {
  return async (req, res, next) => {
    const response = await backend.handleRequest(
      {
        method: req.method,
        path: req.path,
        headers: req.headers as {
          [key: string]: string | string[]
        },
        query: req.query as {
          [key: string]: string | string[]
        },
        body: req.body,
      },
      req,
      res,
    )

    switch (response.type) {
      case 'not-found':
        return next()
      case 'not-implemented':
        return next() // This allows us
      case 'response':
        return res.status(response.status).send(response.body)
      case 'validation-failure':
        return res.status(400).send({
          success: false,
          error: {
            message: 'REQUEST_VALIDATION_ERROR',
            errors: response.validation.errors?.map((error) => error) || [],
          },
        })
    }
  }
}

type Dependencies = {
  backend: Backend
}

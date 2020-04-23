import { Agent } from '@Agent'
import { RequestHandler } from 'express'
import { isLeft } from 'fp-ts/lib/Either'

export const AddMountPointHandler = ({
  agent,
}: Dependencies): RequestHandler => async (req, res) => {
  const { path } = req.body

  if (typeof path !== 'string') {
    return res.status(400).send({
      success: false,
      error: {
        message: `"body.path" MUST be a string`,
      },
    })
  }

  const jobCreationResult = await agent.addMountPoint(path)

  if (isLeft(jobCreationResult)) {
    const statusCode = (() => {
      switch (jobCreationResult.left) {
        case 'DEEPER_MOUNT_POINT_ALREADY_ADDED':
        case 'MOUNT_POINT_ALREADY_CONTAINED_IN_OTHER_MOUNT_POINT':
        case 'MOUNT_POINT_CANNOT_BE_FILESYSTEM_ROOT':
        case 'MOUNT_POINT_MUST_BE_ABSOLUTE':
          return 400
        case 'MOUNT_POINT_MUST_BE_A_FOLDER':
        case 'MOUNT_POINT_DOES_NOT_EXIST':
          return 404
        case 'PERSISTENCY_FAILURE':
          return 500
      }
    })()

    return res.status(statusCode).send({
      success: false,
      error: {
        message: jobCreationResult.left,
      },
    })
  }

  res.send({
    success: true,
  })
}

type Dependencies = {
  agent: Agent
}

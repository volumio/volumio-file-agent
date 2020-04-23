import { Agent } from '@Agent'
import { RequestHandler } from 'express'
import { isLeft } from 'fp-ts/lib/Either'

export const GetMountPointHandler = ({
  agent,
}: Dependencies): RequestHandler => async (req, res) => {
  const { path } = req.query

  if (typeof path !== 'string') {
    return res.status(404).send({
      success: false,
      error: {
        message: `MOUNT_POINT_NOT_FOUND`,
      },
    })
  }

  const mountPointsWithStatsResult = await agent.getAllMountPointsWithStats()

  if (isLeft(mountPointsWithStatsResult)) {
    switch (mountPointsWithStatsResult.left) {
      case 'PERSISTENCY_FAILURE':
        return res.status(500).send({
          success: false,
          error: {
            message: 'PERSISTENCY_FAILURE',
          },
        })
    }
  }

  const { right: mountPoints } = mountPointsWithStatsResult

  const mountPoint = mountPoints.find(
    ({ path: mountPointPath }) => mountPointPath === path,
  )

  if (mountPoint === undefined) {
    return res.status(404).send({
      success: false,
      error: {
        message: `MOUNT_POINT_NOT_FOUND`,
      },
    })
  }

  res.send({
    success: true,
    mountPoint,
  })
}

type Dependencies = {
  agent: Agent
}

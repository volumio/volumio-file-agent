import { Agent } from '@Agent'
import { RequestHandler } from 'express'
import { isLeft } from 'fp-ts/lib/Either'

export const GetStatsHandler = ({
  agent,
}: Dependencies): RequestHandler => async (_, res) => {
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

  res.send({
    success: true,
    mountPoints,
  })
}

type Dependencies = {
  agent: Agent
}

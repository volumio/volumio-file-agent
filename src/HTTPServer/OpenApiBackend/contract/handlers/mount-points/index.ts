import { AgentInterface } from '@Agent'

import { wrapResponse } from '../utils'
import { AddMountPoint } from './AddMountPoint'
import { GetAllMountPoints } from './GetAllMountPoints'
import { RemoveMountPoint } from './RemoveMountPoint'

export const MountPointsHandlers = ({ agent }: Dependencies) => ({
  AddMountPoint: wrapResponse(AddMountPoint({ agent })),
  GetAllMountPoints: wrapResponse(GetAllMountPoints({ agent })),
  RemoveMountPoint: wrapResponse(RemoveMountPoint({ agent })),
})

type MountPointsHandlers = ReturnType<typeof MountPointsHandlers>

export type MountPointsHandlerOutcome = ReturnType<
  MountPointsHandlers[keyof MountPointsHandlers]
>

export type Dependencies = {
  agent: AgentInterface
}

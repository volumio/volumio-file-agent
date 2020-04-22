import { queue } from 'async'

import { Dependencies, Execution } from './Execution'

export const MountPointProcessingQueue = ({
  fs,
  processFolder,
}: Dependencies): MountPointProcessingQueue => {
  const enqueuedMountPoints = new Set<string>()

  const internalQueue = queue(Execution({ fs, processFolder }), 3)

  return {
    add: (mountPointID) => {
      if (enqueuedMountPoints.has(mountPointID)) {
        return
      }

      enqueuedMountPoints.add(mountPointID)
      internalQueue.push(mountPointID, () => {
        enqueuedMountPoints.delete(mountPointID)
      })
    },
    getEnqueuedMountPoints: () => {
      return [...enqueuedMountPoints.values()].sort()
    },
  }
}

export type MountPointProcessingQueue = {
  add: (mountPointID: string) => void
  getEnqueuedMountPoints: () => string[]
}

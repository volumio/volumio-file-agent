import { queue } from 'async'

import { Dependencies, Execution, ExecutionReport } from './Execution'

export const MountPointProcessingQueue = ({
  fs,
  processFolder,
}: Dependencies): MountPointProcessingQueue => {
  const registeredHandlersByMountPoint = new Map<
    string,
    ((report: ExecutionReport) => void)[]
  >()

  const internalQueue = queue(Execution({ fs, processFolder }), 3)

  return {
    add: (mountPointID) => {
      const shouldEnqueue =
        registeredHandlersByMountPoint.has(mountPointID) === false

      const promise = new Promise<ExecutionReport>((resolve) => {
        registeredHandlersByMountPoint.set(
          mountPointID,
          (
            registeredHandlersByMountPoint.get(mountPointID) || []
          ).concat((report) => resolve(report)),
        )
      })

      if (shouldEnqueue) {
        internalQueue.push<ExecutionReport>(mountPointID, (_, report) => {
          const handlers = registeredHandlersByMountPoint.get(mountPointID)
          if (report && handlers) {
            handlers.forEach((fn) => fn(report))
          }
          registeredHandlersByMountPoint.delete(mountPointID)
        })
      }

      return promise
    },
    getEnqueuedMountPoints: () => {
      return [...registeredHandlersByMountPoint.keys()].sort()
    },
  }
}

export type MountPointProcessingQueue = {
  add: (mountPointID: string) => Promise<ExecutionReport>
  getEnqueuedMountPoints: () => string[]
}

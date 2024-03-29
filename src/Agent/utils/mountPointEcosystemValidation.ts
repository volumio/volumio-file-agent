import { Either, left, right } from 'fp-ts/lib/Either'
import { some } from 'lodash'

/**
 * Validates a mountPoint path against the set of
 * known mountPoint paths.
 *
 * The validating mountPoint should be neither the parent, nor the child, of an
 * already known one
 */
export const mountPointEcosystemValidation = (
  mountPoint: string,
  knownMountPoints: string[],
): Either<MountPointEcosystemValidationError, void> => {
  if (
    some(
      knownMountPoints,
      (knownMountPoint) =>
        mountPoint !== knownMountPoint &&
        knownMountPoint.startsWith(mountPoint),
    )
  ) {
    return left('DEEPER_MOUNT_POINT_ALREADY_ADDED')
  }

  if (
    some(
      knownMountPoints,
      (knownMountPoint) =>
        mountPoint !== knownMountPoint &&
        mountPoint.startsWith(knownMountPoint),
    )
  ) {
    return left('MOUNT_POINT_ALREADY_CONTAINED_IN_OTHER_MOUNT_POINT')
  }

  return right(undefined)
}

export type MountPointEcosystemValidationError =
  | 'MOUNT_POINT_ALREADY_CONTAINED_IN_OTHER_MOUNT_POINT'
  | 'DEEPER_MOUNT_POINT_ALREADY_ADDED'

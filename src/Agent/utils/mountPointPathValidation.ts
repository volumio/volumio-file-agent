import { Either, left, right } from 'fp-ts/lib/Either'

export const mountPointPathValidation = (
  path: string,
): Either<MountPointPathValidationError, void> => {
  if (!path.startsWith('/')) {
    return left('MOUNT_POINT_MUST_BE_ABSOLUTE')
  }
  if (path.length === 1) {
    return left('MOUNT_POINT_CANNOT_BE_FILESYSTEM_ROOT')
  }

  return right(undefined)
}

export type MountPointPathValidationError =
  | 'MOUNT_POINT_MUST_BE_ABSOLUTE'
  | 'MOUNT_POINT_CANNOT_BE_FILESYSTEM_ROOT'

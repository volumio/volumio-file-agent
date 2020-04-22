import { FilesystemPort } from '@ports/Filesystem'
import { Either, isLeft, left, right } from 'fp-ts/lib/Either'

export const mountPointStringValidation = async (
  path: string,
  isDirectory: FilesystemPort['isDirectory'],
): Promise<Either<MountPointStringValidationError, string>> => {
  const firstCheck = validateAndParse(path)
  if (isLeft(firstCheck)) {
    return firstCheck
  }

  // Verify that MountPoint exists and is a directory
  const directoryCheck = await isDirectory(firstCheck.right)
  if (isLeft(directoryCheck)) {
    return left('MOUNT_POINT_DOES_NOT_EXIST')
  }
  if (!directoryCheck.right) {
    return left('MOUNT_POINT_MUST_BE_A_FOLDER')
  }

  return right(firstCheck.right)
}

const validateAndParse = (
  mountPoint: string,
): Either<
  'MOUNT_POINT_MUST_BE_ABSOLUTE' | 'MOUNT_POINT_CANNOT_BE_FILESYSTEM_ROOT',
  string
> => {
  const trimmed = mountPoint.trim()

  if (!trimmed.startsWith('/')) {
    return left('MOUNT_POINT_MUST_BE_ABSOLUTE')
  }
  if (trimmed.length === 1) {
    return left('MOUNT_POINT_CANNOT_BE_FILESYSTEM_ROOT')
  }

  return right(trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed)
}

export type MountPointStringValidationError =
  | 'MOUNT_POINT_MUST_BE_ABSOLUTE'
  | 'MOUNT_POINT_CANNOT_BE_FILESYSTEM_ROOT'
  | 'MOUNT_POINT_DOES_NOT_EXIST'
  | 'MOUNT_POINT_MUST_BE_A_FOLDER'

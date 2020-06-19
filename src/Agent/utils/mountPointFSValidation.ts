import { Either, isLeft, left, right } from 'fp-ts/lib/Either'

import { FilesystemPort } from '../ports/Filesystem'

export const mountPointFSValidation = async (
  path: string,
  isDirectory: FilesystemPort['isDirectory'],
): Promise<Either<MountPointFSValidationError, void>> => {
  const isDirectoryCheck = await isDirectory(path)

  if (isLeft(isDirectoryCheck)) {
    return left('MOUNT_POINT_DOES_NOT_EXIST')
  }
  if (isDirectoryCheck.right === false) {
    return left('MOUNT_POINT_MUST_BE_A_FOLDER')
  }

  return right(undefined)
}

export type MountPointFSValidationError =
  | 'MOUNT_POINT_DOES_NOT_EXIST'
  | 'MOUNT_POINT_MUST_BE_A_FOLDER'

import { FilesystemPort } from '../../../ports/Filesystem'
import { findDirectorySubDirectories } from './findDirectorySubDirectories'
import { findFilesInTree } from './findFilesInTree'
import { isDirectory } from './isDirectory'
import { statFile } from './statFile'

export const NodeFilesystemAdapter = (): FilesystemPort => ({
  findDirectorySubDirectories,
  findFilesInTree,
  isDirectory,
  statFile,
})

import { FilesystemPort } from '@ports/Filesystem'

import { findFilesInTree } from './findFilesInTree'
import { isDirectory } from './isDirectory'
import { statFile } from './statFile'

export const NodeFilesystemAdapter = (): FilesystemPort => ({
  findFilesInTree,
  isDirectory,
  statFile,
})

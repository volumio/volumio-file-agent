import { FilesystemPort } from '@ports/Filesystem'

import { findFilesInTree } from './findFilesInTree'
import { statFile } from './statFile'

export const NodeFilesystemAdapter = (): FilesystemPort => ({
  findFilesInTree,
  statFile,
})

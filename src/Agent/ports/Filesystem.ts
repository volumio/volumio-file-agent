import { Either } from 'fp-ts/lib/Either'

export type FilesystemPort = {
  findDirectorySubDirectories: (
    path: string,
  ) => Promise<Either<Error, string[]>>

  /**
   * Search all the files contained in a filesystem tree
   * starting from a root folder.
   * Can filter the results by a set of specified extensions (without leading `.`)
   */
  findFilesInTree: (
    treeRoot: string,
    extensions?: string[],
  ) => Promise<FilesFindingResult>

  isDirectory: (path: string) => Promise<Either<Error, boolean>>

  /**
   * Get minimal stats about a file
   */
  statFile: (path: string) => Promise<Either<Error | 'NOT_A_FILE', FileStat>>
}

export type FileStat = {
  createdOn: Date
  modifiedOn: Date
  size: number
}

export type FilesFindingResult = {
  errors: string[]
  totalFiles: number
  folders: Array<{
    path: string
    fileNames: string[]
  }>
}

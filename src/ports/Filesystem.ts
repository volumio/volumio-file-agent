import { Either } from 'fp-ts/lib/Either'

export type FilesystemPort = {
  /**
   * Search all the files contained in a filesystem tree
   * starting from a root folder.
   * Can filter the results by a set of specified extensions (without leading `.`)
   */
  findFilesInTree: (
    rootFolder: string,
    extensions?: string[],
  ) => Promise<{
    errors: string[]
    files: Array<{
      folder: string
      name: string
    }>
  }>

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

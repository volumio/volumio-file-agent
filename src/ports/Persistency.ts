import { Either } from 'fp-ts/lib/Either'

export type PersistencyPort = {
  getFolderStats: (
    folderPath: string,
  ) => Promise<Either<'PERSISTENCY_FAILURE', FolderStats>>

  removeFilesInFolder: (
    folderPath: string,
    fileNames: string[],
  ) => Promise<Either<'PERSISTENCY_FAILURE', void>>
}

export type FolderStats = {
  path: string
  files: {
    total: number
    processed: number
  }
  music: {
    duration: number
    totalArtists: number
  }
}

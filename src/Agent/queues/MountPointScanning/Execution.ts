import { AsyncResultIterator } from 'async'
import now from 'performance-now'
import { CombineObjects } from 'simplytyped'

import { FilesFindingResult, FilesystemPort } from '../../ports/Filesystem'

export const Execution = ({
  fs,
}: Dependencies): AsyncResultIterator<string, ExecutionReport, never> => async (
  mountPoint,
  done,
) => {
  const start = now()

  // Scan files under MountPoint
  const result = await fs.findFilesInTree(mountPoint, MEDIA_FILE_EXTENSIONS)

  done(null, {
    duration: getDurationFrom(start),
    ...result,
  })
}

export const MEDIA_FILE_EXTENSIONS = [
  '3gp',
  'aac',
  'aif',
  'aifc',
  'aiff',
  'ape',
  'asf',
  'flac',
  'm2a',
  'm4a',
  'm4b',
  'm4pa',
  'm4r',
  'm4v',
  'mp2',
  'mp3',
  'mp4',
  'mpc',
  'oga',
  'ogg',
  'ogm',
  'ogv',
  'ogx',
  'opus',
  'spx',
  'wav',
  'wma',
  'wmv',
  'wv',
  'wvp',
]

const getDurationFrom = (start: number) => now() - start

export type ExecutionReport = CombineObjects<
  FilesFindingResult,
  {
    duration: number
  }
>

export type Dependencies = {
  fs: FilesystemPort
}

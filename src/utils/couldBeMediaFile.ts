import path from 'path'

export const MEDIA_FILE_EXTENSIONS = new Set([
  '.3gp',
  '.aac',
  '.aif',
  '.aifc',
  '.aiff',
  '.ape',
  '.asf',
  '.cue',
  '.flac',
  '.m2a',
  '.m4a',
  '.m4b',
  '.m4pa',
  '.m4r',
  '.m4v',
  '.mp2',
  '.mp3',
  '.mp4',
  '.mpc',
  '.oga',
  '.ogg',
  '.ogm',
  '.ogv',
  '.ogx',
  '.opus',
  '.spx',
  '.wav',
  '.wma',
  '.wmv',
  '.wv',
  '.wvp',
])

export const couldBeMediaFile = (file: string) =>
  MEDIA_FILE_EXTENSIONS.has(path.extname(file))

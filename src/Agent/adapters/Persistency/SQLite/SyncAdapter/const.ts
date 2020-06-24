export const MEDIAFILE_ID_PROPS = ['mountPoint', 'folder', 'name'] as const

export const MEDIAFILE_BINARY_INFO_PROPS = ['size', 'modifiedOn'] as const

export const MEDIAFILE_MISC_PROPS = ['processingStatus', 'favorite'] as const

export const MEDIAFILE_METADATA_PROPS = [
  'title',
  'artists',
  'albumArtist',
  'composers',
  'album',
  'genres',
  'trackNumber',
  'diskNumber',
  'year',

  'musicbrainzTrackID',
  'musicbrainzRecordingID',
  'musicbrainzAlbumID',
  'musicbrainzArtistIDs',
  'musicbrainzAlbumArtistIDs',

  'duration',
  'bitdepth',
  'bitrate',
  'sampleRate',
  'trackOffset',

  'hasEmbeddedAlbumart',
] as const

export const MEDIAFILE_PROPS = [
  ...MEDIAFILE_ID_PROPS,
  ...MEDIAFILE_BINARY_INFO_PROPS,
  ...MEDIAFILE_MISC_PROPS,
  ...MEDIAFILE_METADATA_PROPS,
] as const

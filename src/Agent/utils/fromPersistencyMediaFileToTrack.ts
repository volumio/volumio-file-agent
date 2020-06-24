import { MediaFile } from '@Agent/ports/Persistency'
import { Track } from '@Agent/types'
import { last } from 'lodash'

export const fromPersistencyMediaFileToTrack = (
  mediaFile: MediaFile,
): Track => ({
  favorite: mediaFile.favorite,
  file: {
    folder: mediaFile.folder,
    hasEmbeddedAlbumart: mediaFile.hasEmbeddedAlbumart,
    modifiedOn: mediaFile.modifiedOn,
    name: mediaFile.name,
    size: mediaFile.size,
    type: last(mediaFile.name.split('.')) as string,
  },
  metadata: {
    album: mediaFile.album,
    albumArtist: mediaFile.albumArtist,
    artists: mediaFile.artists,
    bitdepth: mediaFile.bitdepth,
    bitrate: mediaFile.bitrate,
    composers: mediaFile.composers,
    diskNumber: mediaFile.diskNumber,
    duration: mediaFile.duration,
    genres: mediaFile.genres,
    musicbrainz: {
      albumArtistIDs: mediaFile.musicbrainzAlbumArtistIDs,
      albumID: mediaFile.musicbrainzAlbumID,
      artistIDs: mediaFile.musicbrainzArtistIDs,
      recordingID: mediaFile.musicbrainzRecordingID,
      trackID: mediaFile.musicbrainzTrackID,
    },
    sampleRate: mediaFile.sampleRate,
    title: mediaFile.title,
    trackNumber: mediaFile.trackNumber,
    year: mediaFile.year,
  },
  offset: mediaFile.trackOffset,
})

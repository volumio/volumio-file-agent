import { Track as AgentTrack } from '@Agent'
import { uniq } from 'lodash'
import path from 'path'

import { Album } from '../../../endpoints/browsing/entities/Album'

export const agentTracksToAlbum = (tracks: AgentTrack[]): Album => {
  const intermediate = tracks.reduce<Album>(
    (album, track) => {
      album.artists.push(...track.metadata.artists)
      album.albumArtist = album.albumArtist || track.metadata.albumArtist || ''
      if (track.metadata.bitdepth !== null) {
        album.bitdepths.push(track.metadata.bitdepth)
      }
      if (track.metadata.bitrate !== null) {
        album.bitrates.push(track.metadata.bitrate)
      }
      album.composers.push(...track.metadata.composers)
      album.fileTypes.push(track.file.type)
      album.genres.push(...track.metadata.genres)
      if (track.metadata.musicbrainz.albumID) {
        album.musicbrainzIDs.push(track.metadata.musicbrainz.albumID)
      }
      if (track.metadata.sampleRate !== null) {
        album.sampleRates.push(track.metadata.sampleRate)
      }
      album.title = album.title || track.metadata.album || ''
      if (track.file.hasEmbeddedAlbumart) {
        album.trackPathWithEmbeddedAlbumart =
          album.trackPathWithEmbeddedAlbumart ||
          path.resolve(track.file.folder, track.file.name)
      }
      album.year = album.year || track.metadata.year
      return album
    },
    {
      artists: [],
      albumArtist: '',
      bitdepths: [],
      bitrates: [],
      composers: [],
      fileTypes: [],
      genres: [],
      musicbrainzIDs: [],
      sampleRates: [],
      title: '',
      trackPathWithEmbeddedAlbumart: null,
      year: null,
    },
  )

  return {
    artists: uniq(intermediate.artists).sort(),
    albumArtist: intermediate.albumArtist,
    bitdepths: uniq(intermediate.bitdepths).sort(),
    bitrates: uniq(intermediate.bitrates).sort(),
    composers: uniq(intermediate.composers).sort(),
    fileTypes: uniq(intermediate.fileTypes).sort(),
    genres: uniq(intermediate.genres).sort(),
    musicbrainzIDs: uniq(intermediate.musicbrainzIDs).sort(),
    sampleRates: uniq(intermediate.sampleRates).sort(),
    title: intermediate.title,
    trackPathWithEmbeddedAlbumart: intermediate.trackPathWithEmbeddedAlbumart,
    year: intermediate.year,
  }
}

import { Integer } from '@airtasker/spot'

export interface Track {
  favorite: boolean
  file: {
    hasEmbeddedAlbumart: boolean
    path: string
    size: number
    type: string
  }
  metadata: {
    title: string | null
    artists: string[]
    albumArtist: string | null
    composers: string[]
    album: string | null
    genres: string[]
    trackNumber: Integer | null
    diskNumber: Integer | null
    year: Integer | null

    musicbrainz: {
      trackID: string | null
      recordingID: string | null
      albumID: string | null
      artistIDs: string[]
      albumArtistIDs: string[]
    }

    duration: Integer | null
    bitdepth: Integer | null
    bitrate: Integer | null
    sampleRate: Integer | null
  }
  offset: Integer
}

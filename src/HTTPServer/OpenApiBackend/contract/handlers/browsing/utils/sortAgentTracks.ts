import { Track } from '@Agent'

export const sortAgentTracks = (tracks: Track[]): Track[] =>
  tracks.slice().sort((a, b) => {
    if (a.metadata.album === null && b.metadata.album !== null) {
      return -1
    }
    if (a.metadata.album !== null && b.metadata.album === null) {
      return 1
    }
    if (
      a.metadata.album !== null &&
      b.metadata.album !== null &&
      a.metadata.album !== b.metadata.album
    ) {
      return a.metadata.album < b.metadata.album ? -1 : 1
    }

    // We get here if both tracks have no "album" or equal "album"

    if (a.metadata.diskNumber === null && b.metadata.diskNumber !== null) {
      return -1
    }
    if (a.metadata.diskNumber !== null && b.metadata.diskNumber === null) {
      return 1
    }
    if (
      a.metadata.diskNumber !== null &&
      b.metadata.diskNumber !== null &&
      a.metadata.diskNumber !== b.metadata.diskNumber
    ) {
      return a.metadata.diskNumber < b.metadata.diskNumber ? -1 : 1
    }

    // We get here if both tracks have no "diskNumber" or equal "diskNumber"

    if (a.metadata.trackNumber === null && b.metadata.trackNumber !== null) {
      return -1
    }
    if (a.metadata.trackNumber !== null && b.metadata.trackNumber === null) {
      return 1
    }
    if (a.metadata.trackNumber !== null && b.metadata.trackNumber !== null) {
      return a.metadata.trackNumber - b.metadata.trackNumber
    }

    // We get here if both tracks have no "trackNumber"
    return 0
  })

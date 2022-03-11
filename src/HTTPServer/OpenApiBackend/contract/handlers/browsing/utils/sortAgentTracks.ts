import { Track } from '@Agent'

export const sortAgentTracks = (tracks: Track[]): Track[] =>
  tracks.slice().sort((a, b) => {
    const byAlbum = albumSort(a, b)
    const byDiskNumber = diskNumberSort(a, b)
    const byTrackNumber = trackNumberSort(a, b)
    const byYear = yearNumberSort(a, b)

    return byAlbum || byDiskNumber || byTrackNumber || byYear || 0
  })

const albumSort: SortPredicate = (a, b) =>
  a.metadata.album === null && a.metadata.album !== null
    ? -1
    : a.metadata.album !== null && b.metadata.album === null
    ? 1
    : (a.metadata.album as string) < (b.metadata.album as string)
    ? -1
    : (a.metadata.album as string) > (b.metadata.album as string)
    ? 1
    : 0

const diskNumberSort: SortPredicate = (a, b) =>
  a.metadata.diskNumber === null && a.metadata.diskNumber !== null
    ? -1
    : a.metadata.diskNumber !== null && b.metadata.diskNumber === null
    ? 1
    : a.metadata.diskNumber === null && b.metadata.diskNumber === null
    ? 0
    : (a.metadata.diskNumber as number) < (b.metadata.diskNumber as number)
    ? -1
    : (a.metadata.diskNumber as number) > (b.metadata.diskNumber as number)
    ? 1
    : 0

const trackNumberSort: SortPredicate = (a, b) =>
  a.metadata.trackNumber === null && a.metadata.trackNumber !== null
    ? -1
    : a.metadata.trackNumber !== null && b.metadata.trackNumber === null
    ? 1
    : a.metadata.trackNumber === null && b.metadata.trackNumber === null
    ? -1
    : (a.metadata.trackNumber as number) < (b.metadata.trackNumber as number)
    ? -1
    : (a.metadata.trackNumber as number) > (b.metadata.trackNumber as number)
    ? 1
    : 0

const yearNumberSort: SortPredicate = (a, b) =>
  a.metadata.year === null && a.metadata.year !== null
    ? -1
    : a.metadata.year !== null && b.metadata.year === null
    ? 1
    : a.metadata.year === null && b.metadata.year === null
    ? -1
    : (a.metadata.year as number) < (b.metadata.year as number)
    ? -1
    : (a.metadata.year as number) > (b.metadata.year as number)
    ? 1
    : 0

type SortPredicate = (a: Track, b: Track) => SortValue
type SortValue = -1 | 0 | 1

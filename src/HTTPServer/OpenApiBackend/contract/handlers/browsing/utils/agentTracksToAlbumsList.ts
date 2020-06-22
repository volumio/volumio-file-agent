import { Track as AgentTrack } from '@Agent'
import { groupBy, sortBy } from 'lodash'

import { Album } from '../../../endpoints/browsing/entities/Album'
import { agentTracksToAlbum } from './agentTracksToAlbum'

export const agentTracksToAlbumsList = (tracks: AgentTrack[]): Album[] => {
  const tracksHavingDefinedAlbum = tracks.filter(
    ({ metadata }) => metadata.album !== null && metadata.albumArtist !== null,
  )

  const tracksByAlbum = groupBy(
    tracksHavingDefinedAlbum,
    ({ metadata }) => `${metadata.album}:${metadata.albumArtist}`,
  )

  return sortBy(
    Object.values(tracksByAlbum).map(agentTracksToAlbum),
    ({ title }) => title,
  )
}

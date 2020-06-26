import { Track as AgentTrack } from '@Agent'
import { groupBy, sortBy } from 'lodash'

import { Album } from '../../../endpoints/browsing/entities/Album'
import { agentTracksToAlbum } from './agentTracksToAlbum'

export const agentTracksToAlbumsList = (tracks: AgentTrack[]): Album[] => {
  const tracksHavingDefinedAlbum = tracks.filter(
    ({ metadata }) => metadata.album !== null,
  )

  const tracksByAlbum = groupBy(
    tracksHavingDefinedAlbum,
    ({ metadata }) =>
      `${metadata.album?.toLowerCase()}:${metadata.albumArtist || ''}`,
  )

  return sortBy(
    Object.values(tracksByAlbum).map(agentTracksToAlbum),
    ({ year }) => year || 0,
    ({ title }) => title,
  )
}

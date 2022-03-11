import { Track as AgentTrack } from '@Agent'
import path from 'path'

import { Track } from '../../../endpoints/browsing/entities/Track'

export const agentTrackToBrowsingTrack = (track: AgentTrack): Track => ({
  favorite: track.favorite,
  file: {
    hasEmbeddedAlbumart: track.file.hasEmbeddedAlbumart,
    path: path.resolve(track.file.folder, track.file.name),
    size: track.file.size,
    type: track.file.type,
  },
  metadata: track.metadata,
  offset: track.offset,
})

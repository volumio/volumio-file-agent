import { Track as AgentTrack } from '@Agent'
import { uniq } from 'lodash'

export const agentTracksToArtistsList = (tracks: AgentTrack[]): string[] =>
  uniq(
    tracks.reduce<string[]>((allArtists, track) => {
      if (track.metadata.albumArtist !== null) {
        allArtists.push(track.metadata.albumArtist)
      }
      allArtists.push(...track.metadata.artists)
      return allArtists
    }, []),
  ).sort()

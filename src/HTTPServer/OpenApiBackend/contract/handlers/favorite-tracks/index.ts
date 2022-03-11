import { AgentInterface } from '@Agent'

import { wrapResponse } from '../utils'
import { SetTrackAsFavorite } from './SetTrackAsFavorite'
import { SetTrackAsNotFavorite } from './SetTrackAsNotFavorite'

export const FavoriteTracksHandlers = ({ agent }: Dependencies) => ({
  SetTrackAsFavorite: wrapResponse(SetTrackAsFavorite({ agent })),
  SetTrackAsNotFavorite: wrapResponse(SetTrackAsNotFavorite({ agent })),
})

type FavoriteTracksHandlers = ReturnType<typeof FavoriteTracksHandlers>

export type FavoriteTracksHandlerOutcome = ReturnType<
  FavoriteTracksHandlers[keyof FavoriteTracksHandlers]
>

export type Dependencies = {
  agent: AgentInterface
}

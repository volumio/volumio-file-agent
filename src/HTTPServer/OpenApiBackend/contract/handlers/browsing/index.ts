import { AgentInterface } from '@Agent'

import { wrapResponse } from '../utils'
import { GetAlbum } from './GetAlbum'
import { GetAllArtists } from './GetAllArtists'
import { GetAllComposers } from './GetAllComposers'
import { GetAllGenres } from './GetAllGenres'
import { GetAllYears } from './GetAllYears'
import { GetComposer } from './GetComposer'

export const BrowsingHandlers = ({ agent }: Dependencies) => ({
  GetAlbum: wrapResponse(GetAlbum({ agent })),
  GetAllArtists: wrapResponse(GetAllArtists({ agent })),
  GetAllComposers: wrapResponse(GetAllComposers({ agent })),
  GetAllGenres: wrapResponse(GetAllGenres({ agent })),
  GetAllYears: wrapResponse(GetAllYears({ agent })),
  GetComposer: wrapResponse(GetComposer({ agent })),
})

export type Dependencies = {
  agent: AgentInterface
}

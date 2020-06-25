import { AgentInterface } from '@Agent'

import { wrapResponse } from '../utils'
import { GetAlbum } from './GetAlbum'
import { GetAllAlbums } from './GetAllAlbums'
import { GetAllArtists } from './GetAllArtists'
import { GetAllComposers } from './GetAllComposers'
import { GetAllGenres } from './GetAllGenres'
import { GetAllYears } from './GetAllYears'
import { GetArtist } from './GetArtist'
import { GetComposer } from './GetComposer'
import { GetFolderContents } from './GetFolderContents'
import { GetGenre } from './GetGenre'

export const BrowsingHandlers = ({ agent }: Dependencies) => ({
  GetAlbum: wrapResponse(GetAlbum({ agent })),
  GetAllAlbums: wrapResponse(GetAllAlbums({ agent })),
  GetArtist: wrapResponse(GetArtist({ agent })),
  GetAllArtists: wrapResponse(GetAllArtists({ agent })),
  GetAllComposers: wrapResponse(GetAllComposers({ agent })),
  GetAllGenres: wrapResponse(GetAllGenres({ agent })),
  GetAllYears: wrapResponse(GetAllYears({ agent })),
  GetComposer: wrapResponse(GetComposer({ agent })),
  GetFolderContents: wrapResponse(GetFolderContents({ agent })),
  GetGenre: wrapResponse(GetGenre({ agent })),
})

export type Dependencies = {
  agent: AgentInterface
}

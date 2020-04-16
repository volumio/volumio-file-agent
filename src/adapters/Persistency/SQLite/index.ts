import { PersistencyPort } from '@ports/Persistency'
import { Either, left, right } from 'fp-ts/lib/Either'
import { createConnection } from 'typeorm'

import { MediaFile } from './entities'
import { Initial1587032173928 } from './migrations'

export const SQLitePersistencyAdapter = async ({
  databasePath,
  runMigrations,
}: Spec): Promise<Either<'MIGRATIONS_FAILED', PersistencyPort>> => {
  const db = await createConnection({
    type: 'sqlite',
    database: databasePath,
    entities: [MediaFile],
    migrations: [Initial1587032173928],
    migrationsTransactionMode: 'all',
  })

  if (runMigrations) {
    try {
      await db.runMigrations()
    } catch (error) {
      console.log(error)

      return left('MIGRATIONS_FAILED')
    }
  }

  const getFolderStats: PersistencyPort['getFolderStats'] = async () => {
    return left('PERSISTENCY_FAILURE')
  }

  const removeFilesInFolder: PersistencyPort['removeFilesInFolder'] = async () => {
    return left('PERSISTENCY_FAILURE')
  }

  return right({
    getFolderStats,
    removeFilesInFolder,
  })
}

type Spec = {
  databasePath: string
  runMigrations: boolean
}

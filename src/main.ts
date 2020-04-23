import './moduleAlias'

import { SQLitePersistencyAdapter } from '@adapters/Database/SQLite'
import { NodeFilesystemAdapter } from '@adapters/Filesystem/Node'
import { ParallelWorkersMediaFileMetadataProcessingAdapter } from '@adapters/MediaFileMetadataProcessing/ParallelWorkers'
import { Agent } from '@Agent'
import { HTTPServer } from '@HTTPServer'
import { isLeft } from 'fp-ts/lib/Either'
import path from 'path'

async function main() {
  const fs = NodeFilesystemAdapter()

  const persistencyAdapterResult = await SQLitePersistencyAdapter({
    databasePath: path.resolve(__dirname, '..', 'database.sqlite'),
    runMigrations: true,
  })

  if (isLeft(persistencyAdapterResult)) {
    console.error(persistencyAdapterResult.left)
    process.exit(1)
  }

  const db = persistencyAdapterResult.right

  const mediaFileMetadataProcessing = await ParallelWorkersMediaFileMetadataProcessingAdapter()
  process.on('exit', () => {
    mediaFileMetadataProcessing.stop()
  })

  const agent = Agent({
    db,
    fs,
    mediaFileMetadataProcessing,
  })

  const server = HTTPServer({
    agent,
  })

  server.listen(4000)
}

main()

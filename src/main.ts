import './moduleAlias'

import { Agent } from '@Agent'
import { NodeFilesystemAdapter } from '@Agent/adapters/Filesystem/Node'
import { ParallelWorkersMediaFileMetadataProcessingAdapter } from '@Agent/adapters/MediaFileMetadataProcessing/ParallelWorkers'
import { SQLitePersistencyAdapter } from '@Agent/adapters/Persistency/SQLite'
import { HTTPServer } from '@HTTPServer'
import { isLeft } from 'fp-ts/lib/Either'
import path from 'path'

import { init as initHeapDump } from './HeapDump'

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

  const persistency = persistencyAdapterResult.right

  const mediaFileMetadataProcessing = await ParallelWorkersMediaFileMetadataProcessingAdapter()
  process.on('exit', () => {
    mediaFileMetadataProcessing.stop()
  })

  const agent = Agent({
    fs,
    mediaFileMetadataProcessing,
    persistency,
  })

  const server = await HTTPServer({
    agent,
  })

  server.listen(4000)

  if (process.env.WITH_HEAPDUMP === 'true') {
    initHeapDump(__dirname, 3000)
  }
}

main()

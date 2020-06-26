# The File Agent

The code in this folder implements the File Agent application.

The application design attemps to follow a _port & adapters_ architecture.

## Ports & adapters

### Filesystem

[./ports/Filesystem.ts](./ports/Filesystem.ts)

This port is used by the Agent to perform I/O with the filesystem

The adapter used at runtime is [`adapters/Filesystem/Node` ](./adapters/Filesystem/Node).

### MediaFileMetadataProcessing

[./ports/MediaFileMetadataProcessing.ts](./ports/MediaFileMetadataProcessing.ts)

This port actually defines just one async routine (`processMediaFile()`) usable to extract a [music-metadata](https://github.com/Borewit/music-metadata) payload from a given file on the filesystem.

The adapter used at runtime is [`adapters/MediaFileMetadataProcessing/ParallelWorkers` ](./adapters/MediaFileMetadataProcessing/ParallelWorkers).

As the name of the adapter suggets, it spawns a set of workers (scale depends on the number of available cores) which will execute metadata extraction jobs.
When the adapter's process exits then all the worker processes exit.

Communication between the agent's adapter and its workers happens through many [`ØMQ Dealer(1) - Router(N)`](https://zeromq.org/) connections.

The adapter's working model is fairly simple.

For every request it receives:

- It creates a metadata extraction job. The job will have its own unique identity
- The job is fan-out(ed) to one of the workers
- Each worker has an internal execution queue (the queue's concurrency value can be tweaked through the `MAX_CONCURRENT_PROCESSING` constant defined [here](./adapters/MediaFileMetadataProcessing/ParallelWorkers/Worker/ExecutionQueue/index.ts)). Once a job execution terminates, its outcome is packaged in a reply (having the same identity as the executed job) streamed back to the agent's adapter.
- The adapter collects all the workers'replies into an internal observable stream.
  The adapter.processMediaFile() execution routine subescribes to that stream in order to wait for its own extraction result.

### Persistency

[./ports/Persistency.ts](./ports/Persistency.ts)

This port is used by the Agent to perform I/O with the storage of its own domain entities.

The adapter used at runtime is [`adapters/Persistency/SQLite` ](./adapters/Persistency/SQLite).

The adapter uses [`typeorm`](https://www.npmjs.com/package/typeorm) just to perform migrations (defined [here](./adapters/Persistency/SQLite/migrations)).

The adapter uses [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) to implement queries and transactions versus the database.

`better-sqlite3` is a native module (needs a native compile step on install). It uses a syncronous approach to I/O with the database and shows a really good performance. However its implementation is wrapped by an _async_ interface.

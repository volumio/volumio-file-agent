import {
  DatabasePort,
  MutationUsecaseExecutionReport,
  ObservableDatabasePort,
  QueryUsecaseExecutionReport,
  UsecaseExecutionReport,
} from '@ports/Database'
import SQLite from 'better-sqlite3'
import EventEmitter from 'eventemitter3'
import { Either, left, right } from 'fp-ts/lib/Either'
import now from 'performance-now'
import { fromEvent } from 'rxjs'
import { filter } from 'rxjs/operators'
import TypedEmitter from 'typed-emitter'
import { createConnection } from 'typeorm'

import { debug } from './debug'
import { Initial1587032173928 } from './migrations'
import { SyncAdapter } from './SyncAdapter'
import { TupleFromUnion } from './TupleFromUnion'

const QUERIES_USECASES: TupleFromUnion<
  QueryUsecaseExecutionReport['usecase']
> = ['getAllMountPoints', 'getMediaFilesInFolder', 'getMountPointStats']
const MUTATIONS_USECASES: TupleFromUnion<
  MutationUsecaseExecutionReport['usecase']
> = [
  'deleteMediaFiles',
  'deleteMountPoint',
  'setMediaFileFavoriteState',
  'updateMediaFileMetadata',
]

export const SQLitePersistencyAdapter = async ({
  databasePath,
  runMigrations,
}: Spec): Promise<Either<'MIGRATIONS_FAILED', ObservableDatabasePort>> => {
  /**
   * Perform migrations on adapter creation
   * if it is required
   */
  if (runMigrations) {
    const connection = await createConnection({
      type: 'sqlite',
      database: databasePath,
      migrations: [Initial1587032173928],
      migrationsTransactionMode: 'all',
    })

    try {
      const migrations = await connection.runMigrations()
      debug.info.enabled &&
        debug.info(`Performed ${migrations.length} migrations`)
      await connection.close()
    } catch (error) {
      debug.error.enabled &&
        debug.error(`Encountered an error while running migrations`, error)
      await connection.close()
      return left('MIGRATIONS_FAILED')
    }
  }

  const db = new SQLite(databasePath, {
    verbose: debug.dbQuery.enabled
      ? (...args) => debug.dbQuery(...args)
      : undefined,
  })

  const internalEmitter = (new EventEmitter() as unknown) as TypedEmitter<{
    usecaseExecution: (report: UsecaseExecutionReport) => void
  }>

  /**
   * Setup debugging
   */
  if (debug.usecase.enabled) {
    internalEmitter.on('usecaseExecution', (report) =>
      debug.usecase(
        `[%d ms - %s] <-- %s`,
        report.duration.toFixed(1),
        report.outcome._tag === 'Right'
          ? 'OK'
          : `ERROR: ${report.outcome.left}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `${report.usecase}(${(report.arguments as any[])
          .map((x) => JSON.stringify(x))
          .join(', ')})`,
      ),
    )
  }

  const syncAdapter = SyncAdapter(db)

  const asyncEmittingAdapter = (Object.keys(
    syncAdapter,
  ) as (keyof DatabasePort)[]).reduce<DatabasePort>((port, usecase) => {
    const excution = syncAdapter[usecase] as Function

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asyncUsecase = async (...args: any[]) => {
      const start = now()
      const outcome = await excution(...args)
      const duration = now() - start

      internalEmitter.emit('usecaseExecution', {
        usecase,
        arguments: args,
        duration,
        outcome,
      } as UsecaseExecutionReport)

      return outcome
    }

    return {
      ...port,
      [usecase]: asyncUsecase,
    }
  }, Object.create(null))

  /**
   * Create an observable of all the API usecases executions
   */
  const usecaseExecutionReportStream = fromEvent<UsecaseExecutionReport>(
    (internalEmitter as unknown) as EventEmitter<string>,
    'usecaseExecution',
  )

  return right({
    ...asyncEmittingAdapter,
    usecaseExecutions: {
      queries: usecaseExecutionReportStream.pipe(
        filter((report): report is QueryUsecaseExecutionReport =>
          (QUERIES_USECASES as string[]).includes(report.usecase),
        ),
      ),
      mutations: usecaseExecutionReportStream.pipe(
        filter((report): report is MutationUsecaseExecutionReport =>
          (MUTATIONS_USECASES as string[]).includes(report.usecase),
        ),
      ),
      all: usecaseExecutionReportStream,
    },
  })
}

type Spec = {
  databasePath: string
  runMigrations: boolean
}

import heapdump from 'heapdump'
import path from 'path'

let _datadir = ''

/**
 * Initializes the periodic dumping of the memory heap
 * into snapshot files
 */
export const init = (config: {
  /**
   * The directory where the dumps should be saved
   */
  directory: string

  /**
   * The interval at which a dump should be performed.
   * It's going to be 500 minimum.
   */
  tickInterval: number

  /**
   * An eventual prefix you want to set for the dump
   * files name
   */
  filePrefix?: string
}): void => {
  _datadir = config.directory
  setInterval(
    () => tickHeapDump(config.filePrefix),
    Math.max(500, config.tickInterval),
  )
}

const tickHeapDump = (prefix?: string) => {
  const file = path.resolve(
    _datadir,
    `${prefix || ''}.${Date.now()}.heapsnapshot`,
  )
  heapdump.writeSnapshot(file)
}

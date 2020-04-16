import D from 'debug'

const NAMESPACE = `fa:metadata_processing:worker`

const debug = {
  info: D(NAMESPACE),
  error: D(NAMESPACE),
}

debug.info.log = console.log.bind(console)

export { debug }

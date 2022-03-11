import D from 'debug'

const NAMESPACE = `fa:database:sqlite`

const debug = {
  info: D(NAMESPACE),
  error: D(NAMESPACE),
  dbQuery: D(`${NAMESPACE}:query`),
  usecase: D(`${NAMESPACE}:usecase`),
}

debug.info.log = console.log.bind(console)

export { debug }

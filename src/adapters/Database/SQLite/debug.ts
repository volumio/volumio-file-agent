import D from 'debug'

const NAMESPACE = `fa:persistency:sqlite`

const debug = {
  info: D(NAMESPACE),
  error: D(NAMESPACE),
  dbQuery: D(`${NAMESPACE}:db-query`),
  usecase: D(`${NAMESPACE}:usecase-execution`),
}

debug.info.log = console.log.bind(console)

export { debug }

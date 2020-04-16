import D from 'debug'

const NAMESPACE = 'fa:http_server'

const debug = {
  info: D(NAMESPACE),
  error: D(NAMESPACE),
}

debug.info.log = console.log.bind(console)

export { debug }

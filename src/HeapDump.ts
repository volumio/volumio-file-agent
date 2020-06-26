import heapdump from 'heapdump'
import path from 'path'

let _datadir = ''

export const init = (dir: string, interval: number): void => {
  _datadir = dir
  setInterval(tickHeapDump, Math.max(500, interval))
}

const tickHeapDump = () => {
  const file = path.resolve(_datadir, `${Date.now()}.heapsnapshot`)
  heapdump.writeSnapshot(file)
}

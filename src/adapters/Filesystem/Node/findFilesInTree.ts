import { FilesystemPort } from '@ports/Filesystem'
import { exec } from 'child_process'
import { uniq } from 'lodash'
import path from 'path'
import now from 'performance-now'

import { debug } from './debug'

export const findFilesInTree: FilesystemPort['findFilesInTree'] = (
  rootFolder: string,
  extensions?: string[],
) =>
  new Promise((resolve) => {
    const cmd = `find -L ${rootFolder} -type f ${
      extensions && extensions.length
        ? makeExtensionFilteringArgument(extensions)
        : ''
    }`

    const start = now()
    debug.info.enabled &&
      debug.info(
        `[CALL] findFilesInTree(%s, %s extensions)`,
        rootFolder,
        extensions ? `${extensions.length}` : 'ALL',
      )
    exec(
      cmd,
      {
        maxBuffer: 1024 * 1024 * 8, // 8MB. This could allow up to a ~ 80.000 rows result
      },
      (_, stdout, stderr) => {
        const duration = now() - start
        const errors = stderr.length ? stderr.split('\n') : []
        const files = stdout.length
          ? stdout
              .split('\n')
              .filter((line) => line.length > 0)
              .sort()
              .map((filePath) => {
                return {
                  folder: path.dirname(filePath),
                  name: path.basename(filePath),
                }
              })
          : []

        debug.info.enabled &&
          debug.info(
            `[RESULT] findFilesInTree(%s, %s extensions): %d files, %d errors, %d milliseconds, %d bytes`,
            rootFolder,
            extensions ? `${extensions.length}` : 'ALL',
            files.length,
            errors.length,
            duration,
            stdout.length,
          )
        resolve({ errors, files })
      },
    )
  })

/**
 * Creates a filtering argument for the `find` program
 * @param extensions A list of files extensions without `.`
 */
const makeExtensionFilteringArgument = (extensions: string[]): string => {
  const filtering = uniq(extensions)
    .map((ext) => `-iname \*.${ext}`)
    .join(' -o ')
  return `\\( ${filtering} \\)`
}

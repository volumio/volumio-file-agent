import { FilesystemPort } from '@ports/Filesystem'
import { exec } from 'child_process'
import { uniq } from 'lodash'
import path from 'path'

export const findFilesInTree: FilesystemPort['findFilesInTree'] = (
  rootFolder: string,
  extensions?: string[],
) =>
  new Promise((resolve) => {
    const cmd = `find ${rootFolder} -type f ${
      extensions && extensions.length
        ? makeExtensionFilteringArgument(extensions)
        : ''
    }`

    exec(
      cmd,
      {
        maxBuffer: 1024 * 1024 * 4, // 4MB. This could allow up to a ~ 40.000 rows result
      },
      (_, stdout, stderr) => {
        resolve({
          errors: stderr.length ? stderr.split('\n') : [],
          files: stdout.length
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
            : [],
        })
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

import crypto from 'crypto'
import { Either, left, right } from 'fp-ts/lib/Either'
import fs from 'fs'

export enum ChecksumAlgorithm {
  MD5 = 'md5',
  SHA1 = 'sha1',
  SHA256 = 'sha256',
  SHA384 = 'sha384',
  SHA512 = 'sha512',
}

export const checksum = (
  filePath: string,
  algorithm: ChecksumAlgorithm = ChecksumAlgorithm.SHA1, // We set SHA1 as default because it is the fastest
): Promise<Either<NodeJS.ErrnoException, string>> =>
  new Promise((resolve) => {
    try {
      const hash = crypto.createHash(algorithm)

      const stream = fs
        .createReadStream(filePath)
        .on('error', (error) => resolve(left(error)))
        .on('data', (data) => hash.update(data))
        .on('end', () => {
          resolve(right(hash.digest('hex')))
          stream.destroy()
        })
    } catch (error) {
      resolve(left(error))
    }
  })

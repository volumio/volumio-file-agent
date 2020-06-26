import { MediaFileMetadata } from '@Agent/ports/Persistency'
import { AsyncResultIterator } from 'async'
import { Either, left, right } from 'fp-ts/lib/Either'
import * as mm from 'music-metadata'
import path from 'path'
import now from 'performance-now'
import { CombineObjects } from 'simplytyped'

import { debug } from '../debug'

export const execution: AsyncResultIterator<
  JobToExecute,
  ExecutionResult,
  never
> = async (job, done) => {
  const filePath = path.resolve(job.file.folder, job.file.name)

  try {
    const start = debug.info.enabled ? now() : 0
    const metadata = await mm.parseFile(filePath, {
      duration: false,
      skipPostHeaders: true,
    })

    done(
      null,
      right({
        ...job,
        file: {
          ...job.file,
          metadata: {
            title: metadata.common.title || null,
            artists:
              metadata.common.artists && metadata.common.artists.length
                ? metadata.common.artists.sort()
                : metadata.common.artist
                ? [metadata.common.artist]
                : [],
            albumArtist: metadata.common.albumartist
              ? metadata.common.albumartist
              : metadata.common.artists && metadata.common.artists.length
              ? metadata.common.artists[0]
              : metadata.common.artist || null,
            composers: metadata.common.composer
              ? metadata.common.composer.sort()
              : [],
            album: metadata.common.album || null,
            genres: metadata.common.genre ? metadata.common.genre.sort() : [],
            trackNumber: metadata.common.track.no,
            diskNumber: metadata.common.disk.no,
            year: metadata.common.year || null,

            musicbrainzTrackID: metadata.common.musicbrainz_trackid || null,
            musicbrainzRecordingID:
              metadata.common.musicbrainz_recordingid || null,
            musicbrainzAlbumID: metadata.common.musicbrainz_albumid || null,
            musicbrainzArtistIDs: metadata.common.musicbrainz_artistid
              ? metadata.common.musicbrainz_artistid.sort()
              : [],
            musicbrainzAlbumArtistIDs: metadata.common.musicbrainz_albumartistid
              ? metadata.common.musicbrainz_albumartistid.sort()
              : [],

            duration:
              metadata.format.duration !== undefined
                ? Math.round(metadata.format.duration)
                : null,
            bitdepth: metadata.format.bitsPerSample || null,
            bitrate: metadata.format.bitrate
              ? Math.round(metadata.format.bitrate)
              : null,
            sampleRate: metadata.format.sampleRate || null,
            trackOffset: 0,

            hasEmbeddedAlbumart:
              metadata.common.picture !== undefined &&
              metadata.common.picture.length > 0,
          },
        },
        milliseconds: debug.info.enabled ? now() - start : 0,
      }),
    )
  } catch (error) {
    done(
      null,
      left({
        ...job,
        error,
      }),
    )
  }
}

export type ExecutionResult = Either<FailedJob, SuccessfulJob>

export type JobToExecute = CombineObjects<
  JobInfos,
  {
    file: FileToProcess
  }
>

export type FailedJob = CombineObjects<
  JobToExecute,
  {
    error: Error
  }
>

export type SuccessfulJob = CombineObjects<
  JobToExecute,
  {
    file: CombineObjects<
      FileToProcess,
      {
        metadata: MediaFileMetadata
      }
    >
    milliseconds: number
  }
>

type JobInfos = {
  id: Buffer
  requester: Buffer
}

type FileToProcess = {
  folder: string
  name: string
}

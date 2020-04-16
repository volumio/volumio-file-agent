import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

export enum ProcessingStatus {
  DONE = 'DONE',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

@Entity({
  name: 'mediaFiles',
  withoutRowid: true,
})
export class MediaFile {
  @PrimaryColumn('text')
  folder: string

  @PrimaryColumn('text')
  name: string

  @Column('text')
  processingStatus: ProcessingStatus

  @Column('integer')
  size: number

  @Column('datetime')
  modifiedOn: Date

  @Column('boolean', { default: false })
  favorite: boolean

  @Column('text', { nullable: true })
  title: string | null

  @Column('integer', { nullable: true })
  duration: number | null

  @Column('integer', { nullable: true })
  sampleRate: number | null

  @Column('text', { nullable: true })
  @Index()
  artist: string | null

  @Column('text', { nullable: true })
  albumArtist: string | null

  @Column('text', { nullable: true })
  composer: string | null

  @Column('text', { nullable: true })
  @Index()
  album: string | null

  @Column('integer', { nullable: true })
  trackNumber: number | null

  @Column('integer', { nullable: true })
  diskNumber: number | null

  @Column('integer', { nullable: true })
  year: number | null
}

import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm'

export class Initial1592931680468 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * Here we use a plain SQL query because we
     * need to create the table `WITHOUT ROWID`,
     * which is not supported by the TypeORM API
     */
    await queryRunner.query(`
        CREATE TABLE mediaFiles (
            mountPoint TEXT NOT NULL,
            folder TEXT NOT NULL,
            name TEXT NOT NULL,
            
            size INTEGER NOT NULL,
            modifiedOn DATETIME NOT NULL,

            processingStatus TEXT NOT NULL,
            favorite BOOLEAN DEFAULT false,

            title TEXT,
            artists JSON NOT NULL,
            albumArtist TEXT,
            composers JSON NOT NULL,
            album TEXT,
            genres JSON NOT NULL,
            trackNumber INTEGER,
            diskNumber INTEGER,
            year INTEGER,

            musicbrainzTrackID TEXT,
            musicbrainzRecordingID TEXT,
            musicbrainzAlbumID TEXT,
            musicbrainzArtistIDs JSON NOT NULL,
            musicbrainzAlbumArtistIDs JSON NOT NULL,

            duration INTEGER,
            bitdepth INTEGER,
            bitrate INTEGER,
            sampleRate INTEGER,
            trackOffset INTEGER NOT NULL,

            hasEmbeddedAlbumart BOOLEAN DEFAULT false,

            PRIMARY KEY (mountPoint, folder, name)
        ) WITHOUT ROWID;
    `)

    await queryRunner.createIndex(
      'mediaFiles',
      new TableIndex({
        name: 'IDX_ARTIST',
        columnNames: ['artist'],
      }),
    )

    await queryRunner.createIndex(
      'mediaFiles',
      new TableIndex({
        name: 'IDX_ALBUM',
        columnNames: ['album'],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('mediaFiles', 'IDX_ALBUM')
    await queryRunner.dropIndex('mediaFiles', 'IDX_ARTIST')
    await queryRunner.dropTable('mediaFiles')
  }
}

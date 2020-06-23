import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm'

export class Initial1587032173928 implements MigrationInterface {
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
            processingStatus TEXT NOT NULL,
            size INTEGER,
            modifiedOn DATETIME,
            favorite BOOLEAN DEFAULT false,

            title TEXT,
            artist TEXT,
            albumArtist TEXT,
            composers JSON NOT NULL,
            album TEXT,
            genres: JSON NOT NULL,
            trackNumber INTEGER,
            diskNumber INTEGER,
            year INTEGER,

            musicbrainzID TEXT,
            musicbrainzAlbumID TEXT,
            musicbrainzArtistIDs JSON NOT NULL,
            musicbrainzAlbumArtistIDs JSON NOT NULL,

            duration INTEGER,
            bitdepth INTEGER,
            bitrate INTEGER,
            sampleRate INTEGER,

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
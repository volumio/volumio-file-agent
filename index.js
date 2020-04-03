var fs = require('fs-extra');
var path = require('path');
var libQ = require('kew');
var Sequelize = require('sequelize');
var FileScanner = require('./lib/fileScanner');
var metadata = require('./lib/metadata');
var utils = require('./lib/utils');
var chokidar = require('chokidar');

// TODO: move to config?
var ROOT = '/mnt';
var WATCH_EXCLUDE = ['/mnt/NAS'];

// increase version when you change schema
var LIBRARY_VERSION = '1.1';

// On startup, the database are copied to LIBRARY_DB_TEMP and be accessed\written from there.
// After each scanning routine has terminated, it's copied back to LIBRARY_DB.
// This is to minimize sd card writes.
var LIBRARY_DB = '/data/musiclibrary/library-' + LIBRARY_VERSION + '.db';
var LIBRARY_DB_TEMP = '/tmp/library-' + LIBRARY_VERSION + '.db';

var config = {
	debounceTime: 1000,
	debounceSize: 20
};

this.scanStartedAt = null;
this.scanPath = null;

try {
    var stat = fs.statSync(LIBRARY_DB);
    fs.copySync(LIBRARY_DB, LIBRARY_DB_TEMP);
    console.log('MusicLibrary: Database backup loaded');
} catch (e) {
    console.log('MusicLibrary: No database backup');
}


this.sequelize = new Sequelize({
    // logging: false,
    dialect: 'sqlite',
    storage: LIBRARY_DB_TEMP
});

this.model = {};

/**
 * @type {AudioMetadata}
 */
this.model.AudioMetadata = this.sequelize.import(__dirname + '/model/audioMetadata');
// load more models here

this.saveDebounced = utils.debounceTimeAmount(saveRecords, config.debounceTime, config.debounceSize);
this.updateDebounced = utils.debounceTimeAmount(updateRecords, config.debounceTime, config.debounceSize);

this.sequelize.sync(/*{alter: true}*/)
    .catch(function(e) {
        // logger.warn('MusicLibrary: ', e);
        if (e.parent && e.parent.code == 'SQLITE_CORRUPT') {
            console.log(`MusicLibrary: [${e.parent.code}] Database is corrupted and will be dropped`);
            fs.truncateSync(LIBRARY_DB_TEMP);
            return sequelize.sync();
        } else {
            throw e;
        }
    })
    .then(function(e) {
        // SQLITE_CORRUPT
        // initialize file scanning service
        fileScanner = new FileScanner({
            cbStart: onScanStarted,
            cbStop: onScanFinished,
            cbFileFound: processFile,
            cbError: processError,
            cbOtherFound: function() {/* noop */
            }
        });

        // Uncomment the following 2 lines to enable update on start
        scanPath = ROOT;
        fileScanner.addTarget(ROOT);
    });


/**
 * @param {'add'|'change'|'unlink'} eventType
 * @param {string} filename
 */
function onFsChanges(eventType, filename) {
    console.log('MusicLibrary.onFsChanges', eventType, filename);
    var scanFolder = path.dirname(filename);
    if (scanPath != scanFolder) {
        scanPath = scanFolder;
        fileScanner.addTarget(scanFolder);
    }
}

/**
 * @param {Error} err
 * @param {string} location
 * @more NodeJS errors: https://nodejs.org/api/os.html#os_error_constants
 */
function processError(err, location) {
    if (err.code == 'EACCES' || err.code == 'ENOSYS' || err.code == 'EIO') {
        // console.log('MusicLibrary: error %s at %s', err.code, err.path);
        return;
    }

    if (err.code == 'ENOENT') {
        console.log('MusicLibrary: remove files from library:', location);
        // remove content from the library
        return removeFolder(location);
    } else {
        console.log(err);
    }
}


/**
 * @param {string} location
 */
function processFile(location) {
    // console.log('MusicLibrary.processFile: File was found:', location);
    if (!metadata.isMediaFile(location)) {
        return;
    }
    return addFile(location);
}

/**
 *
 */
function onScanStarted() {
    scanStartedAt = new Date();
}

/**
 *
 */
function onScanFinished() {
    // remove all records which are not found during scan
    var scanPath = scanPath;
    scanPath = null;
    console.log('MusicLibrary: remove all unaffected items at ' + scanPath);

    // wait for debounceTime, so we make sure all records are saved/updated
    return libQ.delay(config.debounceTime * 2).then(function() { // we multiply by 2 to make sure cache is processed
        return model.AudioMetadata.destroy({
            where: {
                [Sequelize.Op.and]: {
                    // It's not clear, but 'endsWith' produce "LIKE 'hat%'" condition
                    // http://docs.sequelizejs.com/manual/querying.html#operators
                    location: {[Sequelize.Op.endsWith]: scanPath + path.sep},
                    updatedAt: {[Sequelize.Op.lt]: scanStartedAt}
                }
            }
        });
    }).then(function(numDeleted) {
        console.log('MusicLibrary: removed all unaffected items:', numDeleted);
        return backupDatabase();
    });
}


/**
 * @param {Array<AudioMetadata>} records
 * @return {Promise<*>}
 * @private
 */
function saveRecords(records) {
    // remove duplicates
    // var filteredRecords = underscore.uniq(records, false, underscore.iteratee(function(r) { return r.location+':'+r.trackOffset }));
    return model.AudioMetadata.bulkCreate(records);
}

/**
 * Update 'updatedAt' field value.
 * That's need to make sure file is still exists and wouldn't be removed by when scan is finished.
 * @see {@link onScanFinished}
 *
 * @param {Array<number>} ids
 * @return {Promise<*>}
 * @private
 */
function updateRecords(ids) {
    return sequelize.query('UPDATE AudioMetadata SET updatedAt = ? WHERE AudioMetadata.id in (' + ids.join(',') + ')', {
        replacements: [new Date()]
    });
}

/**
 * @return {Promise<*>}
 * @private
 */
function backupDatabase() {
	return libQ.nfcall(fs.ensureDir, path.dirname(LIBRARY_DB)).then(function() {
		return libQ.nfcall(fs.copy, LIBRARY_DB_TEMP, LIBRARY_DB);
	}).then(function() {
		console.log('MusicLibrary: Database backup done', LIBRARY_DB);
	}).fail(function(err) {
		console.error('MusicLibrary: Database backup failed', err);
	});
};


/**
 * Rescan location and update missing files.
 * Note: it doesn't update metadata for existed files
 * @param {string} [location]
 */
function update(location) {
	this.scanPath = location;
	this.fileScanner.addTarget(location);
};


/**
 * @param {string} location
 * @return {Promise<*>}
 * @private
 */
function removeFolder(location) {
	return this.model.AudioMetadata.destroy({
		where: {
			// It's not clear, but 'endsWith' produce "LIKE 'hat%'" condition
			// http://docs.sequelizejs.com/manual/querying.html#operators
			location: {[Sequelize.Op.endsWith]: location + path.sep}
		}
	});
};


/**
 * Add file to library
 * Debounce is used during scanning process to reduce write operations
 * @param {string} location
 * @return {Promise<*>}
 * @private
 */
function addFile(location) {
	return metadata.parseFile(location)
		.then((metadataArr)=>{
			return utils.iterateArrayAsync(metadataArr, updateMetadata);
		})
		.fail(function(err) {
			console.error(err);
		});


	/**
	 * @param {AudioMetadata} metadata
	 * @return {Promise<any>}
	 * @private
	 */
	function updateMetadata(metadata) {
		var self = this;
		console.log('MusicLibrary: track found: %s - %s', metadata.album, metadata.title);

		metadata.trackOffset = (typeof metadata.trackOffset == 'undefined') ? null : metadata.trackOffset;
		console.log(this.model.AudioMetadata)
		return self.model.AudioMetadata.findOne({
			where: {
				location: metadata.location,
				trackOffset: metadata.trackOffset
			}
		}).then(function(record) {
			// all 'write' operations should be debounced to reduce write operations count
			if (!record) {

				// check the record in cache
				var cachedRecord = saveDebounced._cache.find(function(item) {
					return item.location === metadata.location && item.trackOffset === metadata.trackOffset;
				});

				if (!cachedRecord) {
					return saveDebounced(metadata);
					// return AudioMetadata.create(recordData);
				}

			} else {
				// update 'updatedAt' field
				return updateDebounced(record.id);
			}
		});
	}

};

//
// /**
//  * @param {string} searchStr
//  * @return {Promise<AudioMetadata[]>}
//  */
// MusicLibrary.prototype.searchAll = function(searchStr) {
// 	var self = this;
//
// 	return libQ.resolve().then(function() {
// 		return model.AudioMetadata.findAll({
// 			where: {
// 				[Sequelize.Op.or]: {
// 					title: {[Sequelize.Op.substring]: searchStr},
// 					album: {[Sequelize.Op.substring]: searchStr},
// 					artist: {[Sequelize.Op.substring]: searchStr}
// 				}
// 			},
// 			raw: true
// 		});
// 	});
// };


/**
 * @return {boolean}
 */
function isScanning() {
	return this.fileScanner.isScanning;
};


/**
 * Load track info from database
 * @param {string} location
 * @param {number} [trackOffset]
 * @return {Promise<AudioMetadata>}
 */
function getTrack(location, trackOffset) {
	trackOffset = typeof trackOffset == 'undefined' ? null : trackOffset;

	return libQ.resolve().then(function() {
		return this.model.AudioMetadata.findOne({
			where: {
				location: location,
				trackOffset: trackOffset
			},
			raw: true
		});
	});
};

/**
 * Load track info from database
 * @param {string} artistName
 * @param {string} albumName
 * @return {Promise<Album>}
 */
function getAlbum(artistName, albumName) {
	return searchAlbums({
		where: {
			artist: {[Sequelize.Op.eq]: artistName},
			album: {[Sequelize.Op.eq]: albumName},
		},
		limit: 1
	}).then(function(albums) {
		return albums[0];
	});
};

/**
 * @param {FindOptions} [sequelizeQueryOptions]
 * @return {Promise<Array<Album>>}
 */
function searchTracks(sequelizeQueryOptions) {
	//
	return this.query(sequelizeQueryOptions).then(function(records) {
		// filter duplicates
		return records.filter(function(record, index, arr) {
			return index === arr.findIndex(function(r) {
				// filter duplicates by the following fields:
				return r.album === record.album && r.artist === record.artist && r.title === record.title;
			});
		});
	});
};

/**
 * @param {FindOptions} [sequelizeQueryOptions]
 * @return {Promise<Array<string>>}
 */
function searchArtists(sequelizeQueryOptions) {
	sequelizeQueryOptions = sequelizeQueryOptions || {};
	sequelizeQueryOptions.attributes = sequelizeQueryOptions.attributes || [];
	sequelizeQueryOptions.attributes.push(
		[Sequelize.fn('DISTINCT', Sequelize.col('artist')), 'artist'],
	);

	return this.query(sequelizeQueryOptions).then(function(records) {
		return records.map(function(record) {
			return record.artist;
		});
	});
};


/**
 * @param {FindOptions} [sequelizeQueryOptions]
 * @return {Promise<Array<Album>>}
 */
function searchAlbums(sequelizeQueryOptions) {

	sequelizeQueryOptions = sequelizeQueryOptions || {};
	sequelizeQueryOptions.attributes = sequelizeQueryOptions.attributes || [];
	sequelizeQueryOptions.attributes.push(
		// It's not clear, but 'DISTINCT' works for 'artist' as well
		[Sequelize.fn('DISTINCT', Sequelize.col('album')), 'album'],
		'artist',
		[Sequelize.literal('(SELECT location FROM AudioMetadata AS innerData WHERE innerData.artist = artist AND innerData.album = album LIMIT 1)'), 'trackLocation'],
		[Sequelize.literal('(SELECT year FROM AudioMetadata AS innerData WHERE innerData.artist = artist AND innerData.album = album LIMIT 1)'), 'year'],
		// SQLITE specific:
		// When we use aggregated function we have to specify 'AudioMetadata' explicitly
		// Otherwise we have NOT specify
		[Sequelize.literal('(SELECT sum(duration) FROM AudioMetadata AS innerData WHERE innerData.artist = AudioMetadata.artist AND innerData.album = AudioMetadata.album)'), 'duration'],
	);

	//
	return this.query(sequelizeQueryOptions).then(function(records) {
		return records.map(function(record) {
			return {
				artist: record.artist,
				album: record.album,
				trackLocation: record.dataValues.trackLocation,
				year: record.dataValues.year,
				duration: record.dataValues.duration
			};
		});
	});
};


/**
 * @param {string} [searchString]
 * @return {Promise<Array<string>>}
 */
function searchGenres(searchString) {

	return libQ.resolve().then(function() {
		// 'distinct'
		return this.model.AudioMetadata.findAll({
			attributes: [
				[Sequelize.fn('DISTINCT', Sequelize.col('genre')), 'genre']
			],
			where: searchString ? {
				genre: {[Sequelize.Op.substring]: searchString}
			} : {
				genre: {[Sequelize.Op.not]: null}
			},
			order: ['genre'],
			raw: true
		}).then(function(records) {
			return records.map(function(record) {
				return record.genre;
			});
		});
	});
};


/**
 * Run arbitrary query
 * @param {FindOptions} sequelizeQueryOptions
 * @return {Promise<Array<AudioMetadata|*>>}
 */
function query(sequelizeQueryOptions) {

	return libQ.resolve().then(function() {
		return this.model.AudioMetadata.findAll(sequelizeQueryOptions);
	});
};


/**
 * Get folder content
 * returns:
 *  - for file entry: {type: 'file', data:AudioMetadata}
 *  - for collection entry: {type: 'collection', data:AudioMetadata}
 *  - for folder entry: {type: 'folder', data:string} where 'data'data is an absolute folder path
 *
 * @param {string} location
 * @return {Promise<Array<{type: 'file'|'folder'|'collection', data:AudioMetadata|string}>>}
 */
function lsFolder(location) {
	// for root folders - we need to see if there any files inside
	// if no files - don't show it
	var isRoot = location == ROOT;


	function _lsTrackResult(record){
		if (record.isMetafile) {
			return {type: 'collection', data: record};
		} else {
			return {type: 'file', data: record};
		}
	}

	function _lsFolderResult(fullname){

		if (isRoot) {
			return libQ.nfcall(fs.readdir, fullname).then(function(folderEntries) {
				if (folderEntries.length > 0) {
					return {type: 'folder', data: fullname};
				} else {
					// return nothing = don't show it
					console.log('MusicLibrary.lsFolder empty folder', fullname);
				}
			});
		} else {
			// check any music file inside it
			return this.model.AudioMetadata.findOne({
				where: {
					// It's not clear, but 'endsWith' produce "LIKE 'hat%'" condition
					// http://docs.sequelizejs.com/manual/querying.html#operators
					location: {[Sequelize.Op.endsWith]: fullname + path.sep},
				},
				raw: true
			}).then(function(record) {
				if (record) {
					return {type: 'folder', data: fullname};
				}
			});
		}
	}


	return getTrack(location).then(function(record) {
		if (record) {
			// This is a metatrack, get it's content
			return this.model.AudioMetadata.findAll({
				where: {
					// It's not clear, but 'endsWith' produce "LIKE 'hat%'" condition
					// http://docs.sequelizejs.com/manual/querying.html#operators
					metafile: {[Sequelize.Op.eq]: location},
				},
				raw: true
			}).then(function(records) {
				return records.map(function(record){
					return _lsTrackResult(record);
				})
			});
		} else {
			// this is a folder
			return utils.readdir(location).then(function(folderEntries) {
				return utils.iterateArrayAsync(folderEntries, function(stats) {
					if (!stats.name.startsWith('.')) {
						var fullname = path.join(location, stats.name);

						if (stats.isFile()) {
							// file
							if (metadata.isMediaFile(fullname)) {
								return getTrack(fullname).then(function(record) {
									if (record) {
										return _lsTrackResult(record);
									}
									// else - ignore it
								});
							}

						} else if (stats.isDirectory()) {
							// folder
							return _lsFolderResult(fullname);
						} else {
							console.log('MusicLibrary.lsFolder unknown entry type', fullname);
						}
						// ignore all other types
					}

				});
			});
		}
	});
};



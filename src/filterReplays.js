var fs = require('fs');
var util = require('util');
var path = require('path');
var csv = require('fast-csv');
var Promise = require('bluebird');
var _ = require('lodash');
var concat = require('concat-files');

var ensureWrite = require('../lib/ensure-write');
var defer = require('../lib/defer');
var walkdir = require('../lib/walk-dir');

walkdir('./data', /replays_index.+\.csv/)
	.then(readReplayIndices)
	.then(createMasterFile);

function readReplayIndices(files) {
	var filteredFiles = [];

	return Promise.all(
		_.map(files, function(file) {
			return readIntrestingRows(file)
				.then(function(rows) {
					if(!_.isEmpty(rows))  {
						var newFile = './data/processed/' + file;
						filteredFiles.push(newFile);
						return ensureWrite(newFile)
							.then(function() { return writeCsv(newFile, rows) });
					}
				});
		})
	).then(_.constant(filteredFiles));
}

function createMasterFile(files) {
	var masterFile = './data/processed/master_replays.csv';
	return ensureWrite(masterFile)
		.then(function() {
			var deferred = defer();
			concat(files, masterFile, deferred.resolve );

			return deferred.promise;
		})
}

function readIntrestingRows(filename) {
	var deferred = defer();

	var fullpath = path.join('./data', filename);
	var stream = fs.createReadStream(fullpath);
	var rows = [];

	csv
		.fromStream(stream, { headers: true })
		.on('data', function(data) {
			if(isInterestingRow(data))
				rows.push(data);
		})
		.on('end', function() { 
			deferred.resolve(rows);
		});

	return deferred.promise;
}

function isInterestingRow(row) {
	return row.gametype == '2' &&
		   row.isleaguematch == '1' &&
		   parseInt(row.p1_leagueid) >= 4 &&
		   parseInt(row.p2_leagueid) >= 4;
}

function writeCsv(filename, rows) {
	var deferred = defer();

	var csvStream = csv.createWriteStream({ headers: true });
	var stream = fs.createWriteStream(filename);

	stream
		.on('finish', function() {
			deferred.resolve(filename);
		})
		.on('error', function(err) {
			console.log('erroring!');
			deferred.reject(err);
		});

	csvStream.pipe(stream);
	_.each(rows, csvStream.write, csvStream);
	csvStream.end();

	return deferred.promise;
}

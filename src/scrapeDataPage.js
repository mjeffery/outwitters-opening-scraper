var _ = require('lodash');
var Promise = require('bluebird');
var rp = require('request-promise');
var async = require('async');

var saveToDisk = require('../lib/save-to-disk');
var promisifyQueue = require('../lib/promisify-queue');
var unzipRequest = require('../lib/unzip-request');

rp.get('http://osn.codepenguin.com/labs/data')
	.then(scrapeRows)
	.then(convertRows)
	.then(saveToDisk('data/master_index.json'))
	.then(processRows);

function scrapeRows(html) {
	var matcher = /var data =\s*([^;]*)/.exec(html) || [];
	return JSON.parse(matcher[1]);
}

function convertRows(rawRows) {
	return _.map(rawRows, function(rawRow) {
		return {
			created: rawRow.created,
			season: rawRow.season,
			replaysAt: 'http://osn.codepenguin.com/data/dumps/replays/replays_' + rawRow.created + '.csv.gz',
			leaderboardAt: 'http://osn.codepenguin.com/data/dumps/leaderboards/leaderboards_season' + rawRow.season +'_teams_' + rawRow.created + '.csv.gz'
		};
	});
}

function processRows(rows) {
	return promisifyQueue(rows, getReplaysForRow, 5);	
}

function getReplaysForRow(row) {
	return unzipRequest(row.replaysAt)
		.then(saveToDisk('data/replays_index.' + row.created + '.csv'));
}

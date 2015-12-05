var _ = require('lodash');
var Promise = require('bluebird');
var rp = require('request-promise');
var async = require('async');

var tools = require('../lib/tools');
var unzipRequest = require('../lib/unzip-request');

rp.get('http://osn.codepenguin.com/labs/data')
	.then(scrapeRows)
	.then(convertRows)
	.then(tools.saveToDisk('data/master_index.json'))
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
	var queue = async.queue(processRow, 5);	
	var pushJob = Promise.promisify(queue.push, { context: queue });

	queue.pause();
	var promise = Promise.all(
		_.map(rows, function(row) {
			return pushJob(row);
		})
	);
	queue.resume();

	return promise;
}

function processRow(row, callback) {
	return unzipRequest(row.replaysAt)
		.then(tools.saveToDisk('data/replays.' + row.created + '.csv'))
		.asCallback(callback);
}

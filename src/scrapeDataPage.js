var _ = require('lodash');
var Promise = require('bluebird');
var rp = require('request-promise');
var cheerio = require('cheerio');
var async = require('async');

var tools = require('../lib/tools');
var promisifyQueue = require('../lib/promisify-queue');
var unzipRequest = require('../lib/unzip-request');

rp.get('http://osn.codepenguin.com/labs/data')
	.then(function(html) {
		return Promise.all([
			scrapeReplayIndices(html),
			scrapeLeagues(html)	
		]);	
	})

function scrapeReplayIndices(html) {
	return Promise.resolve(html)
		.then(scrapeRows)
		.then(convertRows)
		.then(tools.saveToDisk('data/master_index.json'))
		.then(processRows);
}

function scrapeLeagues(html) {
	return Promise.resolve(html)
		.then(function(html) {
			var $ = cheerio.load(html);	

			$('table').eq(0).find('tr').each(function(i, elem) {

			});
		})
}

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
	return promisifyQueue(rows, processRow, 5);	
}

function processRow(row) {
	return Promise.all([
		getReplaysForRow(row),
		getLeaderboardsForRow(row)
	]);
}

function getReplaysForRow(row) {
	return unzipRequest(row.replaysAt)
		.then(tools.saveToDisk('data/replays_index.' + row.created + '.csv'));
}

function getLeaderboardsForRow(row) {
	return unzipRequest(row.leaderboardAt)
		.then(tools.saveToDisk('data/leaderboards.' + row.created + '.csv'))
}

var fs = require('fs');
var csv = require('fast-csv');
var Promise = require('bluebird');
var rp = require('request-promise');
var _ = require('lodash');
var async = require('async');

var saveToDisk = require('../lib/save-to-disk');
var ensureWrite = require('../lib/ensure-write');

var q = async.queue(worker, 10);
var pushJob = Promise.promisify(q.push, { context: q });

var saved = 0;
var finished = false;

var stream = fs.createReadStream('./data/processed/master_replays.csv');
csv
	.fromStream(stream, { headers: true })
	.on('data', function(data) {
		pushJob(data.gameid)
			.then(function() { saved++ })
			.catch(function(err) { console.log(err) });
	});

q.drain = function() { 
	console.log('done! ' + saved + ' replays saved.');
	finished = true; 
};

report();

function report() {
	if(!finished) {
		console.log(saved + ' replays saved');
		setTimeout(report, 10000);
	}
}

function worker(id, next) {
	Promise.all([Promise.delay(500), stealReplay(id)])
		.asCallback(next);
}

function stealReplay(id) {
	return rp('http://osn.codepenguin.com/api/getReplay/' + id)
		.then(function(res) { return JSON.parse(res) })
		.then(saveToDisk('./data/replays/' + id + '.json'));
}



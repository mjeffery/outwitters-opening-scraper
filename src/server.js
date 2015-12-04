var util = require('util');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');
var rp = require('request-promise');

var tools = require('../lib/tools');

var writeFile = Promise.promisify(fs.writeFile);

var basepath = 'http://osn.codepenguin.com/api/getReplay/';
var id = 'ahRzfm91dHdpdHRlcnNnYW1lLWhyZHIVCxIIR2FtZVJvb20YgIDAy4yzvgkM'

function loadReplay(id) {
	rp(basepath + id)
		.then(parseJSON)
		.then(getGameState)
		.then(getReplay)
		.then(saveToDisk('replay_' + id + '.txt'))
}

function parseJSON(resp) { return JSON.parse(resp); }
function prettyPrint(obj) { return JSON.stringify(obj, null, 4); }
function concat(join) {
	join = join || '';

	return function(doc, str) {
		doc = doc || '';
		return doc + join + str;
	}
}

function getMapName(data) { return data.viewResponse.mapName; }
function getGameState(data) { return JSON.parse(data.viewResponse.gameState).gameState; }

function getReplay(gameState) {
		return _(gameState.replay)
			.filter({ frameType: 2 })
			.pluck('frameData')
			.map(parseJSON)
			.value();
}

function saveReplay(filename) {
	return function(gameState) {
		var data = _(gameState.replay)
			.filter({ frameType: 2 })
			.pluck('frameData')
			.map(parseJSON)
			.pluck('gameState')
			.map(prettyPrint)
			.reduce(concat('\n'));

		return writeFile(filename, data);
	}
}

function saveToDisk(filename) {
	return function(obj) {
		var data = JSON.stringify(obj, null, 4);
		return writeFile(filename, data)
			.then(function() { return obj; });
	}
}

function print(obj) { 
	console.log(util.inspect(obj, { showHidden: false, depth: null }));
}

loadReplay(id);

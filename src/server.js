var util = require('util');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var _ = require('lodash');

var replayToStates = require('../lib/replay-to-states');
var saveToDisk = require('../lib/save-to-disk');

var file = 'data/replays/ag5vdXR3aXR0ZXJzZ2FtZXIQCxIIR2FtZVJvb20Y_sVeDA.json'

fs.readFileAsync(file)
	.then(replayToStates)
	.then(saveToDisk('replay_states.txt'));

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

function getReplayFrames(gameState) {
		return _(gameState.replay)
			.filter({ frameType: 2 })
			.pluck('frameData')
			.map(parseJSON)
			.pluck('gameState')
			.map(frameToState)
			.value();
}

function frameToState(frame) {
	return {
		map_id: 0, //TODO how to feed this in?
		witSpaces: parseWitSpaces(frame),
		players: parsePlayers(frame),
		active: frame.currentPlayer + 1,
		units: parseUnits(frame)
	};
}

function parseWitSpaces(frame) {
	return _.map(frame.captureTileStates, function(tile) {
		return {
			owner: tile.tileType - 3,
			i: tile.tileI,
			j: tile.tileJ
		};
	});
}

function parsePlayers(frame) {
	var players = _.map(frame.settings, function(player) {
		return { wits: player.actionPoints };
	});

	players[0].base = frame.hp_base0;
	players[1].base = frame.hp_base1;

	return players;
}

function parseUnits(frame) {
	return _.map(frame.units, function(unit) {
		return {
			team: unit.owner,
			type: parseClass(unit),
			hp: parseHealth(unit),
			i: unit.positionI,
			j: unit.positionJ
		};
	});
}

function parseClass(unit) {
	return unit.class + (unit.isAlt > 0 ? 20 : 0);
}

function parseHealth(unit) {
	return unit.isAlt > 0 ? unit.altHealth : unit.health;
}

function print(obj) { 
	console.log(util.inspect(obj, { showHidden: false, depth: null }));
}

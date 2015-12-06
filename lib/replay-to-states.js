var _ = require('lodash');

module.exports = function replayToStates(data) {
	var root = JSON.parse(data);
	var gameState =  JSON.parse(root.viewResponse.gameState).gameState; 
	
	return states = _(gameState.replay)
		.filter({ frameType: 2 })
		.pluck('frameData')
		.map(JSON.parse)
		.pluck('gameState')
		.map(frameToState)
		.value();
}

function frameToState(frame) {
	return {
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

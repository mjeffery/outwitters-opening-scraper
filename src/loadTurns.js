var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var Promise = require('bluebird');
var stateCoder = require('outwitters-state-coder');

var defer = require('../lib/defer');
var makePool = require('../lib/make-db-pool');
var walkdir = require('../lib/walk-dir');
var replayToStates = require('../lib/replay-to-states');
var readFile = Promise.promisify(fs.readFile);


var delete_turns_for_game = 'delete from turns where game_id = ?';

var select_game_info = 'select game_id, map_id from games where replay_id = ?';

var select_raw_code = 'select raw_state_code_id from raw_state_codes where raw_state_code = ?';

var insert_raw_code = 'insert into raw_state_codes (raw_state_code, state) values (?, ?)';

var insert_turn = 'insert into turns (game_id, turn, start_raw_code_id, end_raw_code_id) ' +
				  'values (?, ?, ?, ?)';


var pool = makePool();
var query = Promise.promisify(pool.query, { context: pool });

var q = async.queue(worker, 1);
var finished = false;
var count = 0;

walkdir('data/replays', './replays', /.+\.json/)
	.then(function(files) {
		_.each(files, function(file) {
			q.push(file, function(err) {
				if(err) {
					var id = path.basename(file, '.json');
					console.log(id + ': ' + err);
				}
				count++;
			});
		});
	});

q.drain = function() {
	finished = true;
	console.log('Done! ' + count + ' replays processed');
	pool.end(function(err) { if(err) console.log(err) });
};

(function report() {
	if(!finished) {
		console.log(count + ' replays processed');
		setTimeout(report, 10000);
	}
})();

var saveToDisk = require('../lib/save-to-disk');

function worker(filename, next) {
	var id = path.basename(filename, '.json');
	var game_id;

	Promise.join(
		deleteExistingTurns(id), getGameInfo(id), readFile(filename),
		function(deleted, gameInfo, content) {
			return _(replayToStates(content))
				.take(11)
				.map(function(state, index) {
					state.map = gameInfo.map_id;

					return {
						game_id: gameInfo.game_id,
						turn: index + 1,
						state_code: stateCoder.encode(state),
						state: state
					}
				})
				.value();
		})
		.then(attachStateCodeIds)
		.then(saveToDisk('data/turns/' + id + '.json'))
		.asCallback(next);
}

function attachStateCodeIds(turns) {
	return Promise.each(turns, findOrCreateRawStateCode)
}

function findOrCreateRawStateCode(turn) {
	return query(select_raw_code, [turn.state_code])
		.then(function(results) {
			if(_.isEmpty(results)) {
				var stateText = JSON.stringify(turn.state);

				return query(insert_raw_code, [turn.state_code, stateText])
					.then(function(results) { return results.insertId });
			}
			else {
				return results[0].raw_state_code_id; 
			}
		})
		.then(function(id) {
			return _.extend( { start_raw_state_id: id }, turn);
		})
}

function deleteExistingTurns(id) {
	return query(delete_turns_for_game, [id]);	
}

function getGameInfo(id) {
	return query(select_game_info, [id]).then(_.first)
}

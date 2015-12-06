var fs = require('fs');
var csv = require('fast-csv');
var mysql = require('mysql');
var async = require('async');
var moment = require('moment');

var query = 'insert into games (game_id, created_at, replay_id, map_id, ' +
			'p1_id, p1_leagueid, p1_raceid, p1_name, p1_win, ' + 
			'p2_id, p2_leagueid, p2_raceid, p2_name, p2_win) ' + 
			'values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

var dbconf = require('rc')('db');
var pool = mysql.createPool({
	connectionLimit: 10,
	host: dbconf.host,
	user: dbconf.user,
	password: dbconf.password,
	database: dbconf.database
});

var q = async.queue(worker, 10); 

var stream = fs.createReadStream('./data/processed/master_replays.csv');
csv
	.fromStream(stream, { headers: true })
	.on('data', function(data) {
		q.push(data, function(err) {
			if(err) console.log(err);
		});
	});

q.drain = function() {
	console.log('loading complete!');
	pool.end(function(err) {
		console.log(err);
	});
}

function worker(data, next) {
	pool.query(query, rowToArgs(data), function(err, results, fields) {
		if(err) console.log(err); 
		next();
	});
}

function rowToArgs(row) {
	return [
		row.id,
		convertDatetime(row.created),
		row.gameid,
		row.mapid,
		row.p1_playerid,
		row.p1_leagueid,
		row.p1_raceid,
		row.p1_playername,
		row.p1_winner,
		row.p2_playerid,
		row.p2_leagueid,
		row.p2_raceid,
		row.p2_playername,
		row.p2_winner
	];
}

function convertDatetime(datetime) {
	return moment(datetime, 'M-D-YYYY H:mm:ss').format('YYYY-M-D H:mm:ss');
}

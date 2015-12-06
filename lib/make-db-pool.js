var mysql = require('mysql');
var dbconf = require('rc')('db');

module.exports = function makeDbPool() {
	var pool = mysql.createPool({
		connectionLimit: 10,
		host: dbconf.host,
		user: dbconf.user,
		password: dbconf.password,
		database: dbconf.database
	});

	return pool;
}

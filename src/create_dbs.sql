create database if not exists outwitters;
use outwitters;

drop table if exists games;
create table games (
	game_id int unsigned not null,
    created_at timestamp not null,
    replay_id varchar(255) not null,
    map_id int unsigned not null,
    p1_id int unsigned not null,
    p1_leagueid tinyint unsigned not null,
    p1_raceid tinyint unsigned not null,
    p1_name varchar(255) not null,
    p1_win tinyint(1) not null,
    p2_id int unsigned not null,
    p2_leagueid tinyint unsigned not null,
    p2_raceid tinyint unsigned  not null,
    p2_name varchar(255) not null,
    p2_win tinyint(1) not null,
    primary key (game_id),
    key create_at (created_at),
    key p1_leagueid (p1_leagueid),
    key p2_leagueid (p2_leagueid),
    key p1_raceid (p1_raceid),
    key p2_raceid (p2_raceid)
) engine=myisam default charset=utf8;

drop table if exists raw_state_codes;
create table raw_state_codes (
	raw_state_code_id int unsigned auto_increment,
    raw_state_code varchar(255) not null,
    state text not null,
    primary key (raw_state_code_id),
    unique key (raw_state_code)
) engine=myisam default charset=utf8;

drop table if exists state_codes;
create table state_codes (
	state_code_id int unsigned auto_increment,
    state_code varchar(255) not null,
    state text not null,
    primary key (state_code_id),
    unique key (state_code)
) engine=myisam default charset=utf8;

drop table if exists turns;
create table turns (
	turn_id int unsigned auto_increment,
    game_id int unsigned not null,
    turn int unsigned not null,
    start_raw_code_id int unsigned not null,
    end_raw_code_id int unsigned,
    start_code_id int unsigned,
    end_code_id int unsigned,
    primary key (turn_id),
    key (game_id),
    key (turn),
    key (start_raw_code_id),
    key (start_code_id)
) engine=myisam default charset=utf8;
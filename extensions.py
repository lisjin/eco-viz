from arango import ArangoClient
import config

def db_connect():
	client = ArangoClient(username=config.env['username'], password=config.env['password'])
	db = client.db(config.env['db'])
	return db

db = db_connect()

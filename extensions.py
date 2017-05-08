from arango import ArangoClient
import config

def db_connect():
	client = ArangoClient(username=config.env['username'], password=config.env['password'])
	db = client.db(config.env['db'])
	return db

db = db_connect()

# Dict of brain region component -> node ID set
comps = {
	'DAN': set([25, 39, 66, 71, 79]),
	'DMN': set([18, 26, 50, 52, 54, 56, 75, 90, 91, 95, 100]),
	'FPN': set([14, 42, 51, 65, 94]),
	'LN': set([47, 85]),
	'SMN': set([16, 59, 60, 63, 64, 97, 98]),
	'VAN': set([7, 24, 29, 41, 58, 67, 84, 86]),
	'VN': set([31, 34, 43, 49, 57, 72, 96])
}

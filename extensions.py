from arango import ArangoClient
import config

def db_connect():
	client = ArangoClient(username=config.env['username'], password=config.env['password'])
	db = client.db(config.env['db'])
	return db

db = db_connect()

# Mapping from node ID => region
comps = {
	25: 'DAN', 39: 'DAN', 66: 'DAN', 71: 'DAN', 79: 'DAN',
	18: 'DMN', 26: 'DMN', 50: 'DMN', 52: 'DMN', 54: 'DMN', 56: 'DMN', 75: 'DMN', 90: 'DMN', 91: 'DMN', 95: 'DMN', 100: 'DMN',
	14: 'FPN', 42: 'FPN', 51: 'FPN', 65: 'FPN', 94: 'FPN',
	47: 'LN', 85: 'LN',
	16: 'SMN', 59: 'SMN', 60: 'SMN', 63: 'SMN', 64: 'SMN', 97: 'SMN', 98: 'SMN',
	7: 'VAN', 24: 'VAN', 29: 'VAN', 41: 'VAN', 58: 'VAN', 67: 'VAN', 84: 'VAN', 86: 'VAN',
	31: 'VN', 34: 'VN', 43: 'VN', 49: 'VN', 57: 'VN', 72: 'VN', 96: 'VN'
}

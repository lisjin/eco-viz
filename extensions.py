from pyArango.connection import *
import config

def db_connect():
	conn = Connection(username=config.env['user'], password=config.env['password'])
	db = conn[config.env['db']]
	return db


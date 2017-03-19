from flask import *
from extensions import db_connect

main = Blueprint('main', __name__, template_folder='templates')

@main.route('/')
def main_route():
	db = db_connect()

	# Delete the Users collection if already exists
	if db.hasCollection("Users"):
		db["Users"].delete()
		db.reloadCollections()

	# Create the Users collection
	usersCollection = db.createCollection(name="Users")

	# Create 10 documents in collection
	for i in range(10):
		doc = usersCollection.createDocument()
		doc["name"] = "Doc_%d" % i
		doc._key = "doc_%d" % i
		doc.save()
	print_list = []

	# Append fetched documents to print_list
	for doc in usersCollection.fetchAll():
		print_list.append(doc._key + '<br/>')

	# Remove all documents through an AQL query
	aql = "FOR x IN @@collection REMOVE x IN @@collection"
	db.AQLQuery(aql, bindVars={'@collection': 'Users'})

	return "\n".join(print_list)


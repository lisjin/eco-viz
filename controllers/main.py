from flask import *
from extensions import db

import os
import json

main = Blueprint('main', __name__, template_folder='templates')
@main.route('/<graph_name>')
def main_route(graph_name):
	graph = db.graph(graph_name)
	return json.dumps(graph.edge_definitions())

from flask import *
from extensions import db

from pyArango.collection import Collection, Field, Edges
from pyArango.graph import Graph, EdgeDefinition

import os
import json

class Voxels(Collection):
	_fields = {
		"id": Field()
	}

class Link(Edges):
	_fields = {
		"id": Field()
	}

class BrainGraph(Graph):
	_edgeDefinitions = (EdgeDefinition("Link", fromCollections=["Voxels"], toCollections=["Voxels"]), )
	_orphanedCollections = []


main = Blueprint('main', __name__, template_folder='templates')
@main.route('/')
def main_route():
	db.createCollection("Voxels")
	db.createCollection("Link")
	voxelsGraph = db.createGraph("BrainGraph")

	with open(os.path.abspath('data/pos01.json'), 'r') as edgelist:
		data = json.load(edgelist)

		voxels_dict = {}
		for node in data['nodes']:
			idx = node["id"]
			voxels_dict[idx] = voxelsGraph.createVertex('Voxels', {"id": node["label"]})

		for edge in data['edges']:
			src = voxels_dict[edge["source"]]
			dest = voxels_dict[edge["target"]]
			voxelsGraph.link('Link', src, dest, {"id": edge["id"][1:]})
	return jsonify(data)

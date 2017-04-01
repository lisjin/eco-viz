from flask import *
from extensions import db

import re

api = Blueprint('api', __name__, template_folder='templates')


def get_graph(graph_name):
	graph = db.graph(graph_name)
	graph_num = re.findall('\d+', graph_name)[0]
	return graph, graph_num


@api.route('/api/nodes/<graph_name>')
def nodes_route(graph_name):
	graph, graph_num = get_graph(graph_name)
	cursor = graph.vertex_collection('nodes' + graph_num).all()
	return jsonify({"nodes": cursor.batch()})


@api.route('/api/edges/<graph_name>')
def edges_route(graph_name):
	graph, graph_num = get_graph(graph_name)
	cursor = graph.vertex_collection('links' + graph_num).all()
	return jsonify({"edges": cursor.batch()})


@api.route('/api/traverse/<graph_name>')
def traverse_route(graph_name):
	graph, graph_num = get_graph(graph_name)
	start_node = request.args.get('start_node')
	traversal_results = graph.traverse(
		start_vertex='nodes' + graph_num + '/' + start_node,
		strategy='bfs',
		vertex_uniqueness='global',
		edge_uniqueness='path',
		min_depth=1,
		max_depth=2
	)
	print('num paths: %d' % len(traversal_results['paths']))
	print('num results: %d' % len(traversal_results['vertices']))
	return jsonify(traversal_results)

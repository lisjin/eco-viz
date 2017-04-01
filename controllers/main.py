from flask import *
from extensions import db

import os
import json
import re
import operator

main = Blueprint('main', __name__, template_folder='templates')


def get_graph(graph_name):
	graph = db.graph(graph_name)
	graph_num = re.findall('\d+', graph_name)[0]
	return graph, graph_num


@main.route('/')
def main_route():
	return render_template('index.html')


@main.route('/data/<path:path>')
def send_data(path):
	type = request.args.get('type')
	if type == 'struc_distr':
		strucs = {}
		strucs_flat = []
		entry = json.load(open(os.path.join(os.path.realpath(os.path.dirname(__file__)), '..', 'data', path)))
		for e in entry:
			strucs.setdefault(e['struc'], 0)
			strucs[e['struc']] += 1
		for k, v in strucs.iteritems():
			strucs_flat.append({'category': k, 'amount': v})
		return json.dumps(sorted(strucs_flat, key=lambda k: k['amount'], reverse=True))
	elif type == 'node_distr':
		nodes = {}
		nodes_flat = []
		entry = json.load(open(os.path.join(os.path.realpath(os.path.dirname(__file__)), '..', 'data', path)))
		for e in entry:
			for n in e['nodes']:
				nodes.setdefault(n, 0)
				nodes[n] += 1
		for k, v in nodes.iteritems():
			nodes_flat.append({'category': int(k), 'amount': v})
		return json.dumps(sorted(nodes_flat, key=lambda k: k['amount'], reverse=True))
	return send_from_directory('data', path, mimetype='text/html')


@main.route('/static/<path:path>')
def send_static(path):
	type = request.args.get('type')
	return send_from_directory('static', path, mimetype='text/html')
	

@main.route('/api/nodes/<graph_name>')
def nodes_route(graph_name):
	graph, graph_num = get_graph(graph_name)
	cursor = graph.vertex_collection('nodes' + graph_num).all()
	return jsonify({"nodes": cursor.batch()})


@main.route('/api/edges/<graph_name>')
def edges_route(graph_name):
	graph, graph_num = get_graph(graph_name)
	cursor = graph.vertex_collection('links' + graph_num).all()
	return jsonify({"edges": cursor.batch()})


@main.route('/api/traverse/<graph_name>')
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

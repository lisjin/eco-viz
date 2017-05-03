from flask import *
from extensions import db

import re

api = Blueprint('api', __name__, template_folder='templates')


def get_graph(graph_name):
	graph = db.graph(graph_name)
	graph_num = re.findall('\d+', graph_name)[0]
	return graph


def get_tsteps_count(graph_name, r_type):
	return db.aql.execute('FOR e in %s COLLECT tstep = TO_NUMBER(e.tstep) WITH COUNT into counter \
		RETURN {x: tstep, y: (10000 - counter) / 10000, c: @r_type_id}' % (graph_name + '_edges'),
		bind_vars={'r_type_id': 'Rest' if r_type == 'R' else 'Mindful Rest'})


@api.route('/api/nodes/<graph_name>')
def nodes_route(graph_name):
	graph = get_graph(graph_name)
	cursor = graph.vertex_collection(graph_name + '_nodes').all()
	return jsonify({"nodes": cursor.batch()})


@api.route('/api/edges/<graph_name>')
def edges_route(graph_name):
	graph = get_graph(graph_name)
	cursor = graph.vertex_collection(graph_name + '_edges').all()
	return jsonify({"edges": cursor.batch()})


@api.route('/api/traverse/<graph_name>')
def traverse_route(graph_name):
	graph = get_graph(graph_name)
	start_node = request.args.get('start_node')
	traversal_results = graph.traverse(
		start_vertex=graph_name + '_nodes/' + start_node,
		strategy='bfs',
		vertex_uniqueness='global',
		edge_uniqueness='path',
		min_depth=1,
		max_depth=2
	)
	return jsonify(traversal_results)


@api.route('/api/timesteps/<graph_name>')
def timesteps_route(graph_name):
	r_type = graph_name.split('_')[1]
	r_type_alt = 'R' if r_type == 'MR' else 'MR'
	graph_name_alt = re.sub('_%s_' % r_type, '_%s_' % r_type_alt, graph_name)
	c1 = get_tsteps_count(graph_name, r_type)
	c2 = get_tsteps_count(graph_name_alt, r_type_alt)
	results = [c for c in c1] + [c for c in c2]
	return jsonify(results)

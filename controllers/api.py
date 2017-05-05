from flask import *
from extensions import db

import re

api = Blueprint('api', __name__, template_folder='templates')

# Global dict mapping from brain region to node IDs
comps = {
	'DAN': set([25, 39, 66, 71, 79]),
	'DMN': set([18, 26, 50, 52, 54, 56, 75, 90, 91, 95, 100]),
	'FPN': set([14, 42, 51, 65, 94]),
	'LN': set([47, 85]),
	'SMN': set([16, 59, 60, 63, 64, 97, 98]),
	'VAN': set([7, 24, 29, 41, 58, 67, 84, 86]),
	'VN': set([31, 34, 43, 49, 57, 72, 96])
}


def get_region(node_id):
	for region, node_set in comps.iteritems():
		if node_id in node_set:
			return region
	return ''


def get_tsteps_count(graph_name, r_type):
	query = """
	FOR e in %s COLLECT tstep = TO_NUMBER(e.tstep) WITH COUNT into counter
		RETURN {x: tstep, y: (10000 - counter) / 10000, c: @r_type_id}'
	""" % (graph_name + '_edges')
	return db.aql.execute(query, bind_vars={'r_type_id': 'Rest' if r_type == 'R' else 'Mindful Rest'})


def get_traversal(graph_name):
	edge_col = graph_name + '_edges'
	start_node = graph_name + '_nodes/n1'
	query = """
	LET nodes = (FOR v IN ANY @start_node %s RETURN {id: v._id})
	LET links = (FOR v, e IN ANY @start_node %s OPTIONS {maxDepth: 1, includeData: true}
		RETURN {source: e._from, target: e._to, tstep: TO_NUMBER(e.tstep)})
	RETURN {nodes, links}
	""" % (edge_col, edge_col)
	return db.aql.execute(query, bind_vars={'start_node': start_node})


@api.route('/api/traverse/<graph_name>')
def traverse_route(graph_name):
	results = [t for t in get_traversal(graph_name)]
	for i in range(len(results[0]['nodes'])):
		node_id = int(re.findall('\d+', results[0]['nodes'][i]['id'])[-1])
		results[0]['nodes'][i]['region'] = get_region(node_id)
	return jsonify(results[0])


@api.route('/api/timesteps/<graph_name>')
def timesteps_route(graph_name):
	r_type = graph_name.split('_')[1]
	r_type_alt = 'R' if r_type == 'MR' else 'MR'
	graph_name_alt = re.sub('_%s_' % r_type, '_%s_' % r_type_alt, graph_name)
	c1 = get_tsteps_count(graph_name, r_type)
	c2 = get_tsteps_count(graph_name_alt, r_type_alt)
	results = [c for c in c1] + [c for c in c2]
	return jsonify(results)

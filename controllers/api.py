from flask import *
from extensions import db

import re
import requests

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


def parse_node_id(node_str):
	return int(re.findall('\/n\d+', node_str)[0][2:])


def parse_traversal_results(traversal_results):
	return [
		{
			'source': parse_node_id(path['edges'][0]['_from']),
			'target': parse_node_id(path['edges'][0]['_to']),
			'tstep': int(path['edges'][0]['tstep']),
			'id': path['edges'][0]['tstep'] + '_' + re.findall('\d+', path['edges'][0]['id'])[0]
		}
		for path in traversal_results['paths']
	]


def get_tsteps_count(graph_name, r_type):
	query = """
	FOR e in %s COLLECT tstep = TO_NUMBER(e.tstep) WITH COUNT into counter
		RETURN {x: tstep, y: (10000 - counter) / 10000, c: @r_type_id}'
	""" % (graph_name + '_edges')
	return db.aql.execute(query, bind_vars={'r_type_id': 'Rest' if r_type == 'R' else 'Mindful Rest'})


def construct_tc_query(parts):
	parts[1] = 'Rest' if parts[1] is 'R' else 'MindfulRest'
	return 'data/' + parts[0] + '/' + parts[0] + '_' + parts[1] + '+0.' + parts[2][1:] + '-' + parts[3] + '.json'


@api.route('/api/traverse/<graph_name>')
def traverse_route(graph_name):
	graph = db.graph(graph_name)
	parts = graph_name.split('_')
	response = json.loads(requests.get(request.url_root + construct_tc_query(parts)).text)
	nodes = response[0]['nodes']
	all_edges = []
	for node in nodes:
		traversal_results = graph.traverse(
			start_vertex= graph_name + '_nodes/n' + str(node),
			strategy='bfs',
			edge_uniqueness='global',
			min_depth=1,
			max_depth=1,
			filter_func="""
				var node_set = new Set([%s])
				if (!node_set.has(vertex._id) || (path.edges.length && path.edges[0].tstep != 9)) {
					return ["prune", "exclude"];
				}
				return;
			""" % ', '.join(['\"' + graph_name + '_nodes/n' + str(n) + '\"' for n in nodes])
		)
		all_edges += parse_traversal_results(traversal_results)
	all_nodes = [{'id': node, 'label': node,'region': get_region(int(node))} for node in nodes]
	return jsonify({'nodes': all_nodes, 'edges': all_edges})


@api.route('/api/timesteps/<graph_name>')
def timesteps_route(graph_name):
	r_type = graph_name.split('_')[1]
	r_type_alt = 'R' if r_type == 'MR' else 'MR'
	graph_name_alt = re.sub('_%s_' % r_type, '_%s_' % r_type_alt, graph_name)
	c1 = get_tsteps_count(graph_name, r_type)
	c2 = get_tsteps_count(graph_name_alt, r_type_alt)
	results = [c for c in c1] + [c for c in c2]
	return jsonify(results)

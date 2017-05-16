from flask import *
from api import get_region
from collections import Counter

import os
import json

main = Blueprint('main', __name__, template_folder='templates')


def get_strucs(entry):
	strucs = {}
	strucs_flat = []

	for e in entry:
		strucs.setdefault(e['struc'], 0)
		strucs[e['struc']] += 1
	strucs_flat = [{'category': k, 'amount': v} for k, v in strucs.iteritems()]
	return strucs_flat


def get_nodes(entry, grouped):
	nodes = {}
	nodes_flat = []
	num_strucs = len(entry)
	
	for e in entry:
		for n in e['nodes']:
			nodes.setdefault(n, 0)
			nodes[n] += 1
	if grouped:
		count = Counter(nodes.values())
		nodes_flat = [{'category': int(k), 'amount': count[k]} for k in count]
	else:
		nodes_flat = [{'category': int(k), 'amount': v, 'region': get_region(int(k))} for k, v in nodes.iteritems()]
	return nodes_flat[:10]


@main.route('/con-viz')
def con_route():
	try:
		mode = int(request.args.get('mode'))
	except TypeError:
		mode = 1
	options = {
		'connectome': True,
		'dropdown_mode': mode
	}
	return render_template('con-viz.html', **options)


@main.route('/tc-viz')
def tc_route():
	options = {
		'connectome': False,
		'dropdown_mode': 1
	}
	return render_template('tc-viz.html', **options)


@main.route('/data/<path:path>')
def send_data(path):
	req_type = request.args.get('type')
	entry = json.load(open(os.path.join(os.path.realpath(os.path.dirname(__file__)), '..', 'data', path)))

	if req_type == 'struc_distr':
		strucs_flat = get_strucs(entry)
		return json.dumps(sorted(strucs_flat, key=lambda k: k['amount'], reverse=True))
	elif req_type == 'node_distr':
		nodes_flat = get_nodes(entry, True)
		return json.dumps(sorted(nodes_flat, key=lambda k: k['category']))
	elif req_type == 'node_distr2':
		nodes_flat = get_nodes(entry, False)
		return json.dumps(sorted(nodes_flat, key=lambda k: k['amount'], reverse=True))
	return jsonify(entry)

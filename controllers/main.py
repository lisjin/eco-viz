from flask import *
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
	for k, v in strucs.iteritems():
		strucs_flat.append({'category': k, 'amount': v})
	return strucs_flat


def get_nodes(entry):
	nodes = {}
	nodes_flat = []
	
	for e in entry:
		for n in e['nodes']:
			nodes.setdefault(n, 0)
			nodes[n] += 1
	count = Counter(nodes.values())
	for k in count:
		nodes_flat.append({'category': int(k), 'amount': count[k]})
	return nodes_flat


@main.route('/')
def main_route():
	return render_template('index.html')


@main.route('/data/<path:path>')
def send_data(path):
	req_type = request.args.get('type')
	entry = json.load(open(os.path.join(os.path.realpath(os.path.dirname(__file__)), '..', 'data', path)))

	if req_type == 'struc_distr':
		strucs_flat = get_strucs(entry)
		return json.dumps(sorted(strucs_flat, key=lambda k: k['amount'], reverse=True))
	elif req_type == 'node_distr':
		nodes_flat = get_nodes(entry)
		return json.dumps(sorted(nodes_flat, key=lambda k: k['category']))
	return jsonify(entry)

from flask import *

import os
import json

main = Blueprint('main', __name__, template_folder='templates')


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

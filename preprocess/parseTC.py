import sys
import json
import io
import math

NUM_COMPONENTS = 7


def parse_line(line, comp_set):
	"""
	Args:
		line (str): Single line from TimeCrunch summary file
		comp_set (set): Component nodes
	Returns:
		Parsed structure (str), nodes (list), time steps (list), and component nodes (set)
	"""
	parts = line.split(',')
	struc = line[:3]				# Structure type (e.g., 'ffc') is first 3 chars
	nodes = parts[0].split()[1:]	# Nodes are space separated list after 1st comma
	tsteps = parts[1].split()		# Time steps are space separated list after 2nd comma

	# Bipartite structures have two sets of nodes
	# So convert ['<struc> <nodes1>', '<nodes2>', '<tsteps>'] -> ['<struc> <nodes>', '<tsteps>']
	split_start = -1
	if len(parts) > 2:
		split_start = len(nodes)
		nodes += tsteps
		tsteps = parts[2].split()
	comps = comp_set.intersection(set(nodes))
	return struc, nodes, split_start, tsteps, comps


def calc_entropy(comp_dict_cur, comp_dict_counts):
	"""
	Args:
		comp_dict_cur (dict): Current component nodes in form {<struc>: <count>}
	Returns:
		Relative entropy (float)
	"""
	total_orig = float(sum(comp_dict_counts.values()))
	total_cur = float(sum(comp_dict_cur.values()))

	entropy = float(0)
	for k, v in comp_dict_cur.iteritems():
		# Compute entropy relative to maximum entropy, which is based on # of total outcomes
		q = comp_dict_cur[k] / total_cur
		entropy += q * math.log(q, NUM_COMPONENTS)
	return -1 * entropy


def get_entropy(comp_dict, comp_dict_counts, comps):
	"""
	Args:
		comp_dict (dict): Original dictionary of component nodes
		comps (set): All component nodes
	Returns:
		Relative entropy (float)
	"""
	comp_dict_cur = {}
	for region, node_set in comp_dict.iteritems():
		cur_inter = node_set.intersection(comps)
		if len(cur_inter):
			comp_dict_cur[region] = len(cur_inter)
	return calc_entropy(comp_dict_cur, comp_dict_counts)


def main():
	fname = sys.argv[1]

	# Read in and store the known set of component nodes
	components = []		# List of components
	comp_dict = {}		# Dictionary of components keyed by brain region
	with io.open('components.txt', 'r') as cfile:
		for idx, line in enumerate(cfile):
			cur_comps = line.split()[1:]
			comp_dict[line.split()[0]] = set(cur_comps)
			components += cur_comps
	comp_set = set(components)
	comp_dict_counts = {k: len(v) for k, v in comp_dict.items()}

	# For each line in TimeCrunch file, parse the structure and store in list
	patterns = []
	with io.open(fname, 'r') as infile:	
		for idx, line in enumerate(infile):
			struc, nodes, split_start, tsteps, comps = parse_line(line, comp_set)
			entropy = get_entropy(comp_dict, comp_dict_counts, comps)

			pattern = {'struc': struc, 'nodes': nodes,'num_nodes': len(nodes), 'comps': list(comps),
			'num_comps': len(comps), 'tsteps': tsteps, 'cross_entropy': entropy}
			if split_start > -1:
				pattern['split_start'] = split_start
			patterns.append(pattern)

	# Write the populated dictionary of structures to file
	with io.open(fname.split('_greedy')[0] + '.json', 'w') as outfile:
		outfile.write(unicode(json.dumps(patterns, sort_keys=True, indent=4, separators=(',', ': '))))

if __name__ == '__main__':
	main()

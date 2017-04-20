import sys
import json
import io
import math
import pdb


def calc_cross_entropy(comp_dict_cur, comp_dict_counts):
	total_orig = float(sum(comp_dict_counts.values()))
	total_cur = float(sum(comp_dict_cur.values()))

	cross_entropy = float(0)
	for k, v in comp_dict_counts.iteritems():
		if k in comp_dict_cur:
			p = v / total_orig
			q = comp_dict_cur[k] / total_cur
			assert(p <= 1)
			assert(q <= 1)
			cross_entropy += (p) * math.log(q)
	return -1 * cross_entropy


def parse_line(line, comp_set):
	parts = line.split(',')
	struc = line[:3]
	nodes = parts[0].split()[1:]
	tsteps = parts[1].split()
	if len(parts) > 2:
		nodes += tsteps
		tsteps = parts[2].split()
	comps = comp_set.intersection(set(nodes))
	return struc, nodes, tsteps, comps


def get_cross_entropy(comp_dict, comp_dict_counts, comps):
	comp_dict_cur = {}
	for region, node_set in comp_dict.iteritems():
		cur_inter = node_set.intersection(comps)
		if len(cur_inter):
			comp_dict_cur[region] = len(cur_inter)
	return calc_cross_entropy(comp_dict_cur, comp_dict_counts)


def main():
	fname = sys.argv[1]
	patterns = []
	components = []
	comp_dict = {}

	with io.open('components.txt', 'r') as cfile:
		for idx, line in enumerate(cfile):
			cur_comps = line.split()[1:]
			comp_dict[line.split()[0]] = set(cur_comps)
			components += cur_comps

	comp_set = set(components)
	comp_dict_counts = {k: len(v) for k, v in comp_dict.items()}

	with io.open(fname, 'r') as infile:	
		for idx, line in enumerate(infile):
			struc, nodes, tsteps, comps = parse_line(line, comp_set)
			cross_entropy = get_cross_entropy(comp_dict, comp_dict_counts, comps)
			
			patterns.append({'struc': struc, 'nodes': nodes,'num_nodes': len(nodes), 'comps': list(comps), 'num_comps': len(comps),
				'tsteps': tsteps, 'cross_entropy': cross_entropy})

	with io.open(fname.split('_greedy')[0] + '.json', 'w') as outfile:
		outfile.write(unicode(json.dumps(patterns, sort_keys=True, indent=4, separators=(',', ': '))))

if __name__ == '__main__':
	main()

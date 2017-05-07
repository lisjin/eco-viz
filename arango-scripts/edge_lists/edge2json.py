import sys
import json
import os
import re

INPUT_DIR = sys.argv[1]

# Input edge list of form '<src> <dest>' on each line and output in JSON format
PREF = sys.argv[1].replace('Mindful', 'M').replace('Rest', 'R').replace('.', '').replace('+', '-').replace('-', '_')
edges = []
for filename in os.listdir(INPUT_DIR):
	fpath = sys.argv[1] + '/' + filename
	if os.path.isfile(fpath):
		f = open(fpath)
		tstep = re.findall('\d+', filename)[0]
		for idx, line in enumerate(f):
			edge = {}
			src = line.split()[0]
			dest = line.split()[1]
			edge['_from'] = PREF + '_nodes' + '/' + 'n' + src
			edge['_to'] = PREF + '_nodes' + '/' + 'n' + dest
			edge['id'] = 'e' + str(idx)
			edge['tstep'] = tstep
			edges.append(edge)
		f.close()
		
with open(PREF + '_edges.json', 'w') as edge_outf:
	edge_outf.write(unicode(json.dumps(edges, indent=4, separators=(',', ': '))))
edge_outf.close()

# with open('nodes.json', 'w') as node_outf:
# 	node_outf.write(unicode(json.dumps(
# 		[{'_key': 'n' + str(n), 'value': str(n)} for n in range(1, 101)], indent=4, separators=(',', ': '))))
# node_outf.close()

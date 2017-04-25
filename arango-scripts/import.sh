#!/bin/bash

DB=tc-viz
GRAPH_NAME=MH03_MR-045-12
NODES_NAME=$GRAPH_NAME-nodes
LINKS_NAME=$GRAPH_NAME-edges

# Create vertex collection from file
arangoimp --server.database "$DB" --server.password "" --file nodes.json --type json --collection $NODES_NAME --create-collection true


# Create empty edge collection (annoying, but necessary)
arangosh --server.username "root" --server.password "" --server.database "$DB" --quiet <<EOF
db._createEdgeCollection("$LINKS_NAME");
EOF

# Insert edges from file into edge collection
arangoimp --server.database "$DB" --server.password "" --file $LINKS_NAME.json --type json --collection $LINKS_NAME --from-collection-prefix $NODES_NAME --to-collection-prefix $NODES_NAME

# Create graph by linking vertices to edges
arangosh --server.username "root" --server.password "" --server.database "$DB" --quiet <<EOF
var graph_module = require('org/arangodb/general-graph');
var edgeDefinitions = [{collection: "$LINKS_NAME", "from": ["$NODES_NAME"], "to": ["$NODES_NAME"]}];
graph_module._create("$GRAPH_NAME", edgeDefinitions)
EOF

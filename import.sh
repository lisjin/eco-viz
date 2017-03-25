#!/bin/bash

FILES=data/*.json
DB=mydb
ITER=1

# Prefixes for ArangoDB objects
NODES_PREF=nodes0
LINKS_PREF=links0
GRAPHS_PREF=graphs0

for f in `ls $FILES | sort`
do
  if [[ $f =~ "nodes" ]]  # This is a node JSON file
  then
    echo "Processing $f..."
    # Create vertex collection from file
    arangoimp --server.database "$DB" --server.password "" --file $f --type json --collection $NODES_PREF$ITER --create-collection true

    # Update iteration (only do this once per graph)
    (( ITER++ ))
    if [ "$ITER" -eq "10" ]
    then
      NODES_PREF=nodes
      LINKS_PREF=links
      GRAPHS_PREF=graphs
    fi
  else  # This is an edge JSON file
    # Create empty edge collection (annoying, but necessary)
    arangosh --server.username "root" --server.password "" --server.database "$DB" --quiet <<EOF
    db._createEdgeCollection("$LINKS_PREF$ITER");
EOF

    # Insert edges from file into edge collection
    arangoimp --server.database "$DB" --server.password "" --file $f --type json --collection $LINKS_PREF$ITER --from-collection-prefix $NODES_PREF$ITER --to-collection-prefix $NODES_PREF$ITER

    # Create graph by linking vertices to edges
    arangosh --server.username "root" --server.password "" --server.database "$DB" --quiet <<EOF
    var graph_module = require('org/arangodb/general-graph');
    var edgeDefinitions = [{collection: "$LINKS_PREF$ITER", "from": ["$NODES_PREF$ITER"], "to": ["$NODES_PREF$ITER"]}];
    graph_module._create("$GRAPHS_PREF$ITER", edgeDefinitions)
EOF
  fi
done

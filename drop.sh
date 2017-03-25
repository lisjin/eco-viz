#!/bin/bash

DB=mydb
GRAPHS_PREF=graphs0

for i in $(seq 1 $1)
do
  arangosh --server.username "root" --server.password "" --server.database "$DB" --quiet << EOF
    var graph_module = require("@arangodb/general-graph");
    graph_module._drop("$GRAPHS_PREF$i", true);
EOF
if [ "$i" -eq "9" ]
then
  GRAPHS_PREF=graphs
fi
done 

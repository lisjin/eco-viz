#!/bin/bash

for g in ./*
do
if [[ $g =~ "edges" ]]
then
g=${g##*/}
g=${g%_edges.json}
DB=tc-viz
GRAPH_NAME=$g

arangosh --server.username "root" --server.password "" --server.database "$DB" --quiet << EOF
var graph_module = require("@arangodb/general-graph");
graph_module._drop("$GRAPH_NAME", true);
EOF
fi
done
#!/bin/bash

DB=tc-viz
GRAPH_NAME=MH03_MR-030-12

arangosh --server.username "root" --server.password "" --server.database "$DB" --quiet << EOF
var graph_module = require("@arangodb/general-graph");
graph_module._drop("$GRAPH_NAME", true);
EOF

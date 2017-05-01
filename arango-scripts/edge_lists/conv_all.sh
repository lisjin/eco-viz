#!/bin/bash

for e in *
do
	echo "Processing $e"
	python edge2json.py $e
done

#!/bin/bash

for e in *
do
	if [[ $e =~ "Rest" ]]
	then
		echo "Processing $e"
		python edge2json.py $e
	fi
done

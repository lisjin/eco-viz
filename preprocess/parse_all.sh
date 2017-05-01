#!/bin/bash

TMODELS=tmodels/*
for t in $TMODELS
do
	if [[ $t =~ "tmodel" ]]
	then
		echo "Processing $t"
		python parseTC.py $t
	fi
done

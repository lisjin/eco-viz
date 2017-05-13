// Total number of nodes in graph
window.numNodes = 100;

// Mapping from brain region to color (chosen arbitrarily)
window.regionRGBMap = {
	'DAN': '239,83,80', // Red
	'DMN': '255,167,38', // Orange
	'FPN': '255,238,88', // Yellow
	'LN': '102,187,106', // Green
	'SMN': '66,165,245', // Blue
	'VAN': '92,107,192', // Indigo
	'VN': '171,71,188', // Violet
	'': '189,189,189' // Grey (empty string key denotes unlabeled node)
};

// Mapping for brain region to index
window.regionCircleMap = {
	'DAN': 0,
	'DMN': 1,
	'FPN': 2,
	'LN': 3,
	'SMN': 4,
	'VAN': 5,
	'VN': 6,
	'': 7
};

// Return string of RGB color mapping based on brain region of node
function getMappedColor(region) {
	var mappedRGB = window.regionRGBMap[region];
	return 'rgb(' + mappedRGB + ')';
}

// Add class to grey out button on click
function updateTstepButtonClicked($tableSelector, $tstepButton) {
	$tableSelector.find('.js--tstep-button.clicked').removeClass('clicked');
	$tstepButton.addClass('clicked');
}

// Update the ticker below graph to display currently selected structure and time step
function updateTicker(sigmaID, strucIndex, strucName, tstepChoice) {
	var $ticker = $('#' + sigmaID).siblings('.ticker');

	$ticker.find('.tstep-ticker').html(tstepChoice);
	$ticker.find('.struc-ticker').html(strucIndex + 1);
	$ticker.find('.struc-name').html(strucName);
}

// Comparator used to sort nodes first by region, then by ID
function regionCircleCompare(a, b) {
	var separator = window.numNodes * 10;
	var aMappedID = window.regionCircleMap[a.region] * separator + parseInt(a.id);
	var bMappedID = window.regionCircleMap[b.region] * separator + parseInt(b.id);

	if (aMappedID < bMappedID)
		return -1;
	if (aMappedID > bMappedID)
		return 1;
	return 0;
}

// For bipartite cores, need average y values of nodes on left and right sides
function getYAvgVals(sortedNodes, staticStrucName, splitStart) {
	var yLeftAvg = 0;
	var yRightAvg = 0;

	if (staticStrucName === 'bc') {
		sortedNodes.forEach(function(node, i, a) {
			yLeftAvg += (i < splitStart) ? i / splitStart : 0;
			yRightAvg += (i >= splitStart) ? (i - splitStart) / (a.length - splitStart) : 0;
		});
		yLeftAvg /= splitStart;
		yRightAvg /= (sortedNodes.length - splitStart);
		return {left: yLeftAvg, right: yRightAvg};
	}
	return {};
}

// Update the sigma instance located in sigmaID with new dataURL source for graph
function updateSigma(dataURL, sigmaID, strucName, splitStart) {
	$('#' + sigmaID).empty();
	var s = new sigma({
		container: sigmaID,
		renderer: {
			container: document.getElementById(sigmaID),
			type: 'canvas'
		},
		settings: {
			minNodeSize: 3,
			maxNodeSize: 7
		}
	});

	sigma.parsers.json(dataURL, s, function(s) {
		var staticStrucName = strucName.substring(1);
		var sortedNodes = s.graph.nodes().sort(regionCircleCompare);
		var yAvgVals = getYAvgVals(sortedNodes, staticStrucName, splitStart);

		sortedNodes.forEach(function(node, i, a) {
			if (staticStrucName === 'bc') {
				// Initialize node's position in a vertical line on left or right side
				node.x = (i < splitStart) ? 0 : 1;
				node.y = (i < splitStart) ? (i / splitStart) - yAvgVals.left
					: (i - splitStart) / (a.length - splitStart) - yAvgVals.right;
			}
			else if (staticStrucName === 'fc') {
				// Initialize node's position to point along a circle
				node.x = Math.cos(Math.PI * 2 * i / a.length);
				node.y = Math.sin(Math.PI * 2 * i / a.length);
			}

			// Update node's size and color based on its degree and brain region, respectively
			node.size = s.graph.degree(node.id);
			node.color = getMappedColor(node.region);
		});

		s.refresh();
	});
}

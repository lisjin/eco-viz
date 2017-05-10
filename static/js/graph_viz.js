// Global variable mapping from brain region to color (chosen arbitrarily)
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

// Return string of RGB color mapping based on brain region of node
function getMappedColor(region) {
	var mappedRGB = window.regionRGBMap[region];
	return 'rgb(' + mappedRGB + ')';
}

// Update the ticker below graph to display currently selected structure and time step
function updateTicker(sigmaID, strucIndex, tstepChoice) {
	var $ticker = $('#' + sigmaID).siblings('.ticker');

	$ticker.find('.tstep-ticker').html(tstepChoice);
	$ticker.find('.struc-ticker').html(strucIndex + 1);
}

// Update the sigma instance located in sigmaID with new dataURL source for graph
function updateSigma(dataURL, sigmaID) {
	$('#' + sigmaID).empty();
	var s = new sigma({
		container: sigmaID,
		renderer: {
			container: document.getElementById(sigmaID),
			type: 'canvas'
		},
		settings: {
			minNodeSize: 3,
			maxNodeSize: 6
		}
	});

	sigma.parsers.json(dataURL, s, function(s) {
		var allDegrees = s.graph.nodes().map(function(obj) {
			return s.graph.degree(obj.label);
		});

		s.graph.nodes().forEach(function(node, i, a) {
			// Initialize node's position to point along a circle
			node.x = Math.cos(Math.PI * 2 * i / a.length);
			node.y = Math.sin(Math.PI * 2 * i / a.length);

			// Update node's size and color based on its degree and brain region, respectively
			node.size = s.graph.degree(node.id);
			node.color = getMappedColor(node.region);
		});

		// Start the layout algorithm, then stop after specified timeout
		s.startForceAtlas2({slowDown: 10});
		setTimeout(function() {
			s.stopForceAtlas2();
		}, 1000);
	});
}

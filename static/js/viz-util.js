// Offset, in pixels, of navbar from top of window
window.navOffsetTop = $('.navbar').offset().top;

// Total number of nodes in graph
window.numNodes = 100;

// Mapping for brain region to index
window.regionIndexMap = {
	'DAN': 0,
	'DMN': 1,
	'FPN': 2,
	'LN': 3,
	'SMN': 4,
	'VAN': 5,
	'VN': 6,
	'': 9
};

// Toggle 'docked-nav' class based on current offset in relation to navbar
function scrollListener() {
	var scrollTop = $(window).scrollTop();
	var $body = $('body');

	if (window.navOffsetTop < scrollTop && !$body.hasClass('docked-nav')) {
		$('.js--header').css('padding-bottom', $('.navbar').height());
		$body.addClass('docked-nav');
	}
	if (window.navOffsetTop > scrollTop && $body.hasClass('docked-nav')) {
		$('.js--header').css('padding-bottom', 0);
		$body.removeClass('docked-nav');
	}
}

// Replace the data URL of specPath located in specID to specURL
function updateEmbed(specPath, dataURL, specID, chartWidth, hideLegend) {
	$.getJSON(specPath, function(spec) {
		spec.width = chartWidth;
		spec.data[0].url = dataURL;
		if (spec.data.length > 1 && spec.data[1].name === 'edges') {
			spec.data[1].url = dataURL;
		}
		if (hideLegend) {
			delete spec.legends;
		}

		var opt = {
			'actions': { 'export': false, 'source': false, 'editor': false },
			'config': {
				'range': {
					'category': {
						'scheme': 'set2'
					}
				}
			}
		};

		vega.embed(specID, spec, opt, function(error, result) {
			if (error) { console.error(error); };
		});
	});
}

// Return a single object containing currently selected values from dropdown menus
function getGraphParams(suffix) {
	var g = {
		'subject': $('#tc-input-subject' + suffix).find('option:selected')[0].value,
		'thresh': $('#tc-input-thresh' + suffix).find('option:selected')[0].value,
		'tstep': $('#tc-input-tstep' + suffix).find('option:selected')[0].value
	};
	if (window.dropdownMode === 2) {
		g['state'] = $('#tc-input-state' + suffix).find('option:selected')[0].value;
	}
	return g;
}

// Update the pie chart located in svgID with data from dataURL
function updateD3Pie(dataURL, svgID) {
	var margin = {top: 30, left: 60, bottom: 0, right: -40}
	var svg = d3.select(svgID),
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		radius = Math.min(width, height) / 2,
		g = svg.append("g").attr("transform", "translate(" + (width + margin.left) / 2 + "," + (height + margin.top) / 2 + ")");

	var color = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#a05d56", "#d0743c", "#ff8c00"]);

	var pie = d3.pie()
		.sort(null)
		.value(function(d) { return d.amount; });

	var path = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);

	var label = d3.arc()
		.outerRadius(radius + 50)
		.innerRadius(radius - 40);

	var labelAmount = d3.arc()
		.outerRadius(radius - 40)
		.innerRadius(radius - 40);

	// Fetch JSON by making asynchronous call to dataURL
	d3.json(dataURL, function(error, json) {
		if (error) throw error;
		var data = [];
		var totalAmount = 0;
		$.each(json, function(k, v) {
			data.push({
				'category': v['category'],
				'amount': v['amount']
			});
			totalAmount += v['amount'];
		});

		var arc = g.selectAll(".arc")
			.data(pie(data))
			.enter().append("g")
			.attr("class", "arc");

		arc.append("path")
			.attr("d", path)
			.attr("fill", function(d) { return color(d.data.category); });

		arc.append("text")
			.attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
			.attr("dy", "0.35em")
			.text(function(d) { return d.data.category; });

		arc.append("text")
			.classed("amount", true)
			.attr("transform", function(d) { return "translate(" + labelAmount.centroid(d) + ")"; })
			.attr("dy", "0.35em")
			.text(function(d) { return ((d.data.amount / totalAmount) * 100).toFixed(2) + '%'; });
	});
}

// For ranged structures, must show entire range of values from start to end time step
function expandRangedTsteps(data) {
	data.forEach(function(row, i, a) {
		if (row['struc'][0] === 'r') {
			var lowBound = parseInt(row['tsteps'][0]);
			var lastIndex = row['tsteps'].length - 1;
			var upBound = parseInt(row['tsteps'][lastIndex]);

			row['tsteps'] = Array.apply(null, Array(upBound - lowBound + 1)).map(function(_, i) {
				return (lowBound + i).toString();
			});
		}
	});
}

// Construct the API graph traversal URL
function constructTraverseDataURL(g, tstepChoice, strucIndex) {
	return 'api/traverse/' + g.subject + '_' + g.state + '_' + g.thresh.toString().replace('.', '') +
	'_' + g.tstep + '?tstep=' + tstepChoice + '&struc=' + strucIndex;
}

// Construct the TimeCrunch data URL
function constructTCDataURL(g) {
	var stateExpanded = g.state === 'R' ? 'Rest' : 'MindfulRest';
	return 'data/' + g.subject + '/' + g.subject + '_' + stateExpanded + '+' + g.thresh + '-' + g.tstep + '.json';
}

// Use mustache.js to update content in table located in tableTemplID with updated data from dataURL
// Use first structure at first time step in updated table (connectome view) or first row in updated table (TC view) to
// update graph visualizations
function updateTable(dataURL, tableTemplID, tableID, g, sigmaID) {
	$.getJSON(dataURL, function(data) {
		var output = $('#' + tableID);
		var template = $('#' + tableTemplID).html();
		
		expandRangedTsteps(data);

		var index = 1;
		var updatedData = Mustache.render(template, {
			'strucs': data,
			toFixed: function() {
				return function(num, render) { return parseFloat(render(num)).toFixed(4); }
			},
			index: function() { return index++; }
		});
		$('#' + tableID + '-data').remove();
		$('#' + tableID).append(updatedData);

		// Depending on view type, call appropriate function implemented in that view's JS file
		if (window.viewType === 'con') {
			var $tstepButton = $('#' + tableID + ' .js--tstep-button').first();
			updateGraphTable(g, $tstepButton, sigmaID);
		}
		else if (window.viewType === 'tc') {
			var $rowButton = $('.js--row-button').first();
			updateGraphsTable(g, $rowButton);
		}
	});
}

// Comparator used to sort nodes first by region, then by ID
function regionCircleCompare(a, b) {
	var separator = window.numNodes * 10;
	var aMappedID = window.regionIndexMap[a.region] * separator + parseInt(a.id);
	var bMappedID = window.regionIndexMap[b.region] * separator + parseInt(b.id);

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
			node.color = vega.scheme('tableau10')[window.regionIndexMap[node.region]];
		});

		s.refresh();
	});
}

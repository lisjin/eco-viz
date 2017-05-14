// Offset, in pixels, of navbar from top of window
window.navOffsetTop = $('.navbar').offset().top;

// Mode for dropdown menu type
window.dropdownMode = parseInt($('body').attr('data-dropdown-mode'));

// Toggle 'docked-nav' class based on current offset in relation to navbar
function scrollListener() {
	var scrollTop = $(window).scrollTop();
	var $body = $('body');

	if (window.navOffsetTop < scrollTop && !$body.hasClass('docked-nav')) {
		$body.addClass('docked-nav');
	}
	if (window.navOffsetTop > scrollTop && $body.hasClass('docked-nav')) {
		$body.removeClass('docked-nav');
	}
}

// Replace the data URL of specPath located in specID to specURL
function updateEmbed(specPath, dataURL, specID) {
	$.getJSON(specPath, function(spec) {
		spec.data[0].url = dataURL;
		vega.embed(specID, spec);
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

// Update graph visualization, ticker below, and state of time step button clicked
function updateGraphTable(g, $tstepButton, sigmaID) {
	var $parentRow = $tstepButton.parents('tr');

	var tstepChoice = $tstepButton.text();
	var strucIndex = $parentRow.index();
	var dataURL = constructTraverseDataURL(g, tstepChoice, strucIndex);

	var strucName = $parentRow.find('td').first().text();
	var splitStart = $parentRow[0].hasAttribute('data-split-start') ? $parentRow.attr('data-split-start') : '';

	updateSigma(dataURL, sigmaID, strucName, splitStart);
	updateTicker(sigmaID, strucIndex, strucName, tstepChoice);
	updateTstepButtonClicked($tstepButton.parents('table'), $tstepButton);
}

// Use mustache.js to update content in table located in tableTemplID with updated data from dataURL
// Update graph visualizations by using first structure at first time step in updated table
function updateTable(dataURL, tableTemplID, tableID, g, sigmaID) {
	$.getJSON(dataURL, function(data) {
		var output = $('#' + tableID);
		var template = $('#' + tableTemplID).html();
		
		expandRangedTsteps(data);

		var updatedData = Mustache.render(template, {
			"strucs": data,
			toFixed: function() {
				return function(num, render) { return parseFloat(render(num)).toFixed(4); }
			}
		});
		$('#' + tableID + '-data').remove();
		$('#' + tableID).append(updatedData);

		var $tstepButton = $('#' + tableID + ' .js--tstep-button').first();
		updateGraphTable(g, $tstepButton, sigmaID);
	});
}

// Construct the TimeCrunch data URL
function constructTCDataURL(g) {
	var stateExpanded = g.state === 'R' ? 'Rest' : 'MindfulRest';
	return 'data/' + g.subject + '/' + g.subject + '_' + stateExpanded + '+' + g.thresh + '-' + g.tstep + '.json';
}

function constructTstepsDataURL(g, g2, rType, rTypeAlt) {
	return 'api/timesteps/' + g.subject + '_' + g.state + '_' + g.thresh.toString().replace('.', '') + '_' + g.tstep +
		'/' + g2.subject + '_' + g2.state + '_' + g2.thresh.toString().replace('.', '') + '_' + g2.tstep +
		'?r_type=' + rType + '&r_type_alt=' + rTypeAlt;
}

function updateSingleCol(g, TCDataURL, colSide) {
	var i = 1 + colSide;
	var j = 3 + colSide;
	var k = 5 + colSide;

	updateEmbed('static/specs/spec_v1.json', TCDataURL + '?type=node_distr', '#view' + i.toString());
	updateEmbed('static/specs/spec_v3.json', TCDataURL + '?type=node_distr2', '#view' + j.toString());

	var svgID = '#view' + k.toString();
	$(svgID).empty();
	updateD3Pie(TCDataURL + '?type=struc_distr', svgID);

	var suffix = colSide === 0 ? '' : 2;
	updateTable(TCDataURL, 'tc-table' + suffix + '-template', 'tc-table' + suffix, g, 'graph' + suffix);
}

// Update charts, tables, and graph visualizations based on new dropdown menu selections
function tcInputListener() {
	var g = getGraphParams('');
	var g2 = window.dropdownMode === 1 ? Object.assign({}, g) : getGraphParams('2');

	if (window.dropdownMode === 1) {
		g.state = 'R';
		g2.state = 'MR';
	}

	var lTCDataURL = constructTCDataURL(g);
	var rTCDataURL = constructTCDataURL(g2);

	var rType = window.dropdownMode === 1 ? 'Rest' : '1';
	var rTypeAlt = window.dropdownMode === 1 ? 'Mindful%20Rest' : '2';

	var tstepsDataURL = constructTstepsDataURL(g, g2, rType, rTypeAlt);

	updateEmbed('static/specs/spec_v0.json', tstepsDataURL, '#view0');

	if (window.dropdownMode === 2 && !$.isWindow(this)) {
		var colSide = $(this).attr('id').indexOf('2') > -1 ? 1 : 0;

		if (colSide === 0) {
			updateSingleCol(g, lTCDataURL, colSide);
		}
		else if (colSide === 1) {
			updateSingleCol(g2, rTCDataURL, colSide);
		}
	}
	else {
		updateSingleCol(g, lTCDataURL, 0);
		updateSingleCol(g2, rTCDataURL, 1);
	}
}

// Update graph visualizations based on content of clicked time step button
function tstepButtonListener() {
	var g = getGraphParams('');
	var $tstepButton = $(this);
	var sigmaID = $(this).parents('table').is('#tc-table') ? 'graph' : 'graph2';

	if (window.dropdownMode === 1) {
		g['state'] = $(this).parents('table').is('#tc-table') ? 'R' : 'MR';
	}

	updateGraphTable(g, $tstepButton, sigmaID);
}

$(function() {
	// If the viewport is wider than tablet size (750px), dock navbar on scroll
	if ($(window).width() > 750) {
		$(window).on('scroll', scrollListener);
	}

	// Initialize Vega charts, D3 pie charts, and table with data
	tcInputListener();

	// Listen for user selection from dropdown menus
	$('.navbar-item select').change(tcInputListener);

	// Listen for user click of time step buttons
	$('#tc-table, #tc-table2').on('click', '.js--tstep-button', tstepButtonListener);
});

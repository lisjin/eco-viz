// Must be set in order to be compatible with getGraphParams() in viz-util.js
window.dropdownMode = 2;

window.viewType = 'tc';

function constructTstepsDataURL(g, rType) {
	return 'api/timesteps/' + g.subject + '_' + g.state + '_' + g.thresh.toString().replace('.', '') + '_' + g.tstep +
		'?r_type=' + rType;
}

// Update charts, tables, and graph visualizations based on new dropdown menu selections
function tcInputListener() {
	var g = getGraphParams('');
	var TCDataURL = constructTCDataURL(g);
	var tstepsDataURL = constructTstepsDataURL(g, '');
	var traverseDataURL = constructTraverseDataURL(g, '9', '0');

	updateEmbed('static/specs/spec_v0.json', tstepsDataURL, '#view0', 700, true);
	updateTable(TCDataURL, 'tc-table-template', 'tc-table', g, 'graph');
}

function updateRowClicked($parentRow, $rowButton) {
	$('tr.clicked').removeClass('clicked');
	$parentRow.addClass('clicked');

	$('.js--row-button').removeClass('button-primary');
	$rowButton.addClass('button-primary');
}

function updateTicker(strucIndex, strucName) {
	var $ticker = $('.ticker');

	$ticker.find('.struc-ticker').html(strucIndex + 1);
	$ticker.find('.struc-name').html(strucName);
}

function updateGraphs(g, strucIndex, strucName, splitStart, timeSteps) {
	// Create the object we feed to mustache.js
	var tsteps = [];
	var numCols = timeSteps.length < 3 ? 2 : 3;
	var colWidth = timeSteps.length < 3 ? 'six' : 'four';

	timeSteps.forEach(function(tstep, i, a) {
		tsteps.push({
			'tstep': tstep,
			'first_col': i % numCols === 0,
			'last_col': (i + 1) % numCols === 0 || a.length < 3 && i === a.length - 1
		});
	});

	// Append the newly created graph elements to DOM, then fill them with data
	var updatedData = Mustache.render($('#graph-template').html(), {
		'tsteps': tsteps,
		'col_width': colWidth,
		'half': timeSteps.length < 3,
		'one_shot': timeSteps.length === 1
	});

	$(updatedData).appendTo($('#target-row')).each(function() {
		updateTicker(strucIndex, strucName);
		$(this).find('.js--graph-wrapper .graph-container').each(function(i, val) {
			var graphID = $(this).attr('id');
			var tstep = graphID.match(/\d+/g)[0];
			var dataURL = constructTraverseDataURL(g, tstep, strucIndex);

			var updateLegend = (i === 0);
			updateSigma(dataURL, graphID, strucName, splitStart, updateLegend);
		});
	});
}

function updateMatrices(g, strucIndex, strucName, $parentRow, timeSteps) {
	var tickerHTML = Mustache.render($('#ticker-template').html(), {
		'struc_name': strucName,
		'struc_index': strucIndex
	});
	$(tickerHTML).appendTo('#target-row');

	var numNodes = parseInt($parentRow.attr('data-num-nodes'));
	var numCols = numNodes > 50 ? 1 : (numNodes > 30 ? 2 : 3);
	var colWidth = (timeSteps.length === 1 || numCols === 1) ? 'twelve' : (numNodes > 30 ? 'six' : 'four');

	timeSteps.forEach(function(tstep, i, a) {
		var rowID = 'row-' + (Math.floor(i / numCols)).toString();

		if (i % numCols === 0) {
			$(Mustache.render($('#matrix-row-template').html(), { 'row_id': rowID })).appendTo('#target-row');
		}

		var elID = 'view' + tstep.toString();
		var matrixHTML = Mustache.render($('#matrix-template').html(), {
			'col_width': colWidth,
			'el_id': elID,
			'tstep': tstep
		});
		var traverseDataURL = constructTraverseDataURL(g, tstep, strucIndex);

		if (i === 0) {
			$.getJSON(traverseDataURL, function(data) {
				var regionSet = new Set();
				data.nodes.forEach(function(node, i, a) {
					regionSet.add(node.region);
				});
				updateColorLegend(regionSet, false);
			});
		}

		$(matrixHTML).appendTo('#' + rowID).each(function() {
			updateEmbed('static/specs/spec_v5.json', traverseDataURL, '#' + elID, 305, false);
		});
	});
}

// Update graph visualization, ticker below, and state of time step button clicked
function updateGraphsTable(g, $rowButton) {
	var $parentRow = $rowButton.parents('tr');

	var strucIndex = $parentRow.index();
	var strucName = $parentRow.find('td.js--struc').text();
	var splitStart = $parentRow[0].hasAttribute('data-split-start') ? $parentRow.attr('data-split-start') : '';
	var timeSteps = jQuery.makeArray($parentRow.find('td.js--tsteps span')).map(function(el) { return el.innerHTML; });

	updateRowClicked($parentRow, $rowButton);

	$('#target-row').empty();
	if ($rowButton.hasClass('graph-button')) {
		updateGraphs(g, strucIndex, strucName, splitStart, timeSteps);
	}
	else if ($rowButton.hasClass('matrix-button')) {
		updateMatrices(g, strucIndex, strucName, $parentRow, timeSteps);
	}
}

// Update graph visualizations based on content of clicked time step button
function rowButtonListener() {
	var g = getGraphParams('');
	var $rowButton = $(this);

	updateGraphsTable(g, $rowButton);
}

$(function() {
	// If the viewport is wider than tablet size (750px), dock navbar on scroll
	if ($(window).width() > 750) {
		$(window).on('scroll', scrollListener);
	}

	// Initialize Vega charts, D3 pie charts, graph visualizations, and tables with data
	tcInputListener();

	// Listen for user selection from dropdown menus
	$('.navbar-item select').change(tcInputListener);

	// Listen for user click of view button
	$('#tc-table').on('click', '.js--row-button', rowButtonListener);
});

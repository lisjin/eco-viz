// Must be set in order to be compatible with getGraphParams() in viz-util.js
window.dropdownMode = 2;

window.viewType = 'tc';

window.numOffsetMap = {
	1: 'four',
	2: 'two'
}

function constructTstepsDataURL(g, rType) {
	return 'api/timesteps/' + g.subject + '_' + g.state + '_' + g.thresh.toString().replace('.', '') + '_' + g.tstep +
		'?r_type=' + rType;
}

// Update charts, tables, and graph visualizations based on new dropdown menu selections
function tcInputListener() {
	var g = getGraphParams('');
	var TCDataURL = constructTCDataURL(g);
	var tstepsDataURL = constructTstepsDataURL(g, '');

	updateEmbed('static/specs/spec_v0.json', tstepsDataURL, '#view0', 700, true);
	updateTable(TCDataURL, 'tc-table-template', 'tc-table', g, 'graph');
}

function getColOffset(i, arrLength) {
	if (arrLength % 3 > 0 && i % 3 === 0 && i >= arrLength - 3) {
		console.log(i);
		return window.numOffsetMap[arrLength % 3];
	}
	return ''
}

// Update graph visualization, ticker below, and state of time step button clicked
function updateGraphsTable(g, $parentRow) {
	var strucIndex = $parentRow.index();
	var strucName = $parentRow.find('td:nth-child(2)').text();
	var splitStart = $parentRow[0].hasAttribute('data-split-start') ? $parentRow.attr('data-split-start') : '';
	var timeSteps = jQuery.makeArray($parentRow.find('td.js--tsteps span')).map(function(el) { return el.innerHTML; });

	// Create the object we feed to mustache.js
	var tsteps = [];
	timeSteps.forEach(function(tstep, i, a) {
		tsteps.push({
			'first_col': i % 3 === 0,
			'tstep': tstep,
			'last_col': (i + 1) % 3 === 0,
			'offset': getColOffset(i, a.length)
		});
	});

	// Append the newly created graph elements to DOM, then fill them with data
	var template = $('#graph-template').html();
	var updatedData = Mustache.render(template, { "tsteps": tsteps });
	$('#graph-data').remove();
	$(updatedData).prependTo($('.table-wrapper').parent()).each(function() {
		$(this).find('.js--graph-wrapper .graph-container').each(function() {
			var graphID = $(this).attr('id');
			var tstep = graphID.match(/\d+/g)[0];
			var dataURL = constructTraverseDataURL(g, tstep, strucIndex);

			updateSigma(dataURL, graphID, strucName, splitStart);
		});
	});
}

// Update graph visualizations based on content of clicked time step button
function rowButtonListener() {
	var g = getGraphParams('');
	var $parentRow = $(this).parents('tr');
	
	updateGraphsTable(g, $parentRow);
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

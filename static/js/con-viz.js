// Mode for dropdown menu type
window.dropdownMode = parseInt($('body').attr('data-dropdown-mode'));

window.viewType = 'con';

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

// Update graph visualization, ticker below, and state of time step button clicked
function updateGraphTable(g, $tstepButton, sigmaID) {
	var $parentRow = $tstepButton.parents('tr');

	var tstepChoice = $tstepButton.text();
	var strucIndex = $parentRow.index();
	var dataURL = constructTraverseDataURL(g, tstepChoice, strucIndex);

	var strucName = $parentRow.find('td.js--struc').text();
	var splitStart = $parentRow[0].hasAttribute('data-split-start') ? $parentRow.attr('data-split-start') : '';

	updateSigma(dataURL, sigmaID, strucName, splitStart, false);
	updateTicker(sigmaID, strucIndex, strucName, tstepChoice);
	updateTstepButtonClicked($tstepButton.parents('table'), $tstepButton);
}

// Update single column with data, including its D3 pie chart, Vega bar charts, graph visualization, and table
function updateSingleCol(g, TCDataURL, colSide) {
	// Assign indices according to HTML element IDs - [1, 3, 5] correspond to left side, [2, 4, 6] to right
	var i = 1 + colSide;
	var j = 3 + colSide;
	var k = 5 + colSide;

	// Update the D3 pie chart
	var svgID = '#view' + i.toString();
	$(svgID).empty();
	updateD3Pie(TCDataURL + '?type=struc_distr', svgID);

	// Update the two Vega bar charts
	updateEmbed('static/specs/spec_v1.json', TCDataURL + '?type=node_distr', '#view' + j.toString(), 400, false);
	updateEmbed('static/specs/spec_v3.json', TCDataURL + '?type=node_distr2', '#view' + k.toString(), 400, false);

	// Get the appropriate suffix according to column side in order to update table (which updates graph visualization)
	var suffix = colSide === 0 ? '' : 2;
	updateTable(TCDataURL, 'tc-table' + suffix + '-template', 'tc-table' + suffix, g, 'graph' + suffix);
}

// Update charts, tables, and graph visualizations based on new dropdown menu selections
function tcInputListener() {
	// Grab values from dropdown menu and store in objects
	var g = getGraphParams('');
	var g2 = window.dropdownMode === 1 ? Object.assign({}, g) : getGraphParams('2');

	// If mode is 1, set left column's object to 'Rest' and right to 'Mindful Rest'
	if (window.dropdownMode === 1) {
		g.state = 'R';
		g2.state = 'MR';
	}

	// Construct each column's TimeCrunch data URL from data stored in its object
	var lTCDataURL = constructTCDataURL(g);
	var rTCDataURL = constructTCDataURL(g2);

	// Assign labels of line graph for TimeCrunch chart
	var rType = window.dropdownMode === 1 ? 'Rest' : '1';
	var rTypeAlt = window.dropdownMode === 1 ? 'Mindful%20Rest' : '2';

	// For double-column dropdown menus, update only the column whose dropdown was changed
	// Otherwise, update both columns simultaneously
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
	var suffix = window.dropdownMode === 2 ? '2' : '';
	var g = getGraphParams(suffix);
	var $tstepButton = $(this);
	var sigmaID = $(this).parents('table').is('#tc-table') ? 'graph' : 'graph2';

	// For single-column dropdown menu, set the left column as 'Rest' and right as 'Mindful Rest'
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

	// Initialize Vega charts, D3 pie charts, graph visualizations, and tables with data
	tcInputListener();

	// Listen for user selection from dropdown menus
	$('.navbar-item select').change(tcInputListener);

	// Listen for user click of time step buttons
	$('#tc-table, #tc-table2').on('click', '.js--tstep-button', tstepButtonListener);
});

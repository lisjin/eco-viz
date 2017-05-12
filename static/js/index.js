window.navOffsetTop = $('.navbar').offset().top;

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
function updateEmbed(specPath, specURL, specID) {
	$.getJSON(specPath, function(spec) {
		spec.data[0].url = specURL;
		vega.embed(specID, spec);
	});
}

// Return a single object containing currently selected values from dropdown menus
function getGraphParams() {
	return {
		'subject': $('#tc-input-subject').find('option:selected')[0].value,
		'thresh': $('#tc-input-thresh').find('option:selected')[0].value,
		'tstep': $('#tc-input-tstep').find('option:selected')[0].value
	};
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
		if (row['struc'][0] == 'r') {
			var lowBound = parseInt(row['tsteps'][0]);
			var lastIndex = row['tsteps'].length - 1;
			var upBound = parseInt(row['tsteps'][lastIndex]);

			row['tsteps'] = Array.apply(null, Array(upBound - lowBound + 1)).map(function(_, i) {
				return (lowBound + i).toString();
			});
		}
	});
}

// Use mustache.js to update content in table located in tableTemplID with updated data from dataURL
// Update graph visualizations by using first structure at first time step in updated table
function updateTable(dataURL, tableTemplID, tableID, g, restState, sigmaID) {
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

		if (g) {
			var $tstepButton = $('#' + tableID + ' .js--tstep-button').first()
			var tstepChoice = $tstepButton.text();
			var strucIndex = $tstepButton.parents('tr').index();
			var strucName = $('#' + tableID + ' tr td').first().text();

			updateTicker(sigmaID, strucIndex, strucName, tstepChoice);
			updateSigma('api/traverse/' + g.subject + '_' + restState + '_' + g.thresh.toString().replace('.', '') +
				'_' + g.tstep + '?tstep=' + tstepChoice + '&struc=' + strucIndex, sigmaID);
			updateStrucName($('#' + tableID), $tstepButton);
		}
	});
}

// Update charts, tables, and graph visualizations based on new dropdown menu selections
function tcInputListener() {
	var g = getGraphParams();
	var pathR = 'data/' + g.subject + '/' + g.subject + '_Rest+' + g.thresh + '-' + g.tstep + '.json';
	var pathMR = 'data/' + g.subject + '/' + g.subject + '_MindfulRest+' + g.thresh + '-' + g.tstep + '.json';
	var specs = {
		0: 'api/timesteps/' + g.subject + '_R_' + g.thresh.toString().replace('.', '') + '_' + g.tstep,
		1: pathR + '?type=node_distr',
		2: pathMR + '?type=node_distr',
		3: pathR + '?type=struc_distr',
		4: pathMR + '?type=struc_distr'
	};

	for (var i = 0; i < 3; ++i) {
		updateEmbed('static/specs/spec_v' + i.toString() + '.json', specs[i], '#view' + i.toString());
	}

	for (var i = 3; i < 5; ++i) {
		var svgID = '#view' + i.toString();

		$(svgID).empty();
		updateD3Pie(specs[i], svgID);
	}

	updateTable(pathR, 'tc-table-template', 'tc-table', g, 'R', 'graph-rest');
	updateTable(pathMR, 'tc-table2-template', 'tc-table2', g, 'MR', 'graph-mindful-rest');
}

// Update graph visualizations based on content of clicked time step button
function tstepButtonListener() {
	var g = getGraphParams();
	var tstepChoice = this.innerHTML;
	var strucIndex = $(this).parents('tr').index();
	var restState = $(this).parents('table').is('#tc-table') ? 'R' : 'MR';
	var sigmaID = (restState === 'R') ? 'graph-rest' : 'graph-mindful-rest';
	var strucName = $(this).parents('tr').find('td').first().text();

	updateTicker(sigmaID, strucIndex, strucName, tstepChoice);
	updateSigma('api/traverse/' + g.subject + '_' + restState + '_' + g.thresh.toString().replace('.', '') +
				'_' + g.tstep + '?tstep=' + tstepChoice +'&struc=' + strucIndex, sigmaID);
	updateStrucName($(this).parents('table'), $(this));
}

$(function() {
	if ($(window).width() > 750) {
		$(window).on('scroll', scrollListener);
	}

	// Embed Vega charts into their respective page elements
	for (var i = 0; i < 3; ++i) {
		vega.embed('#view' + i.toString(), 'static/specs/spec_v' + i.toString() + '.json');
	}

	// Initialize Vega charts, D3 pie charts, and table with data
	tcInputListener();

	// Listen for user selection from dropdown menus
	$('#tc-input-subject, #tc-input-thresh, #tc-input-tstep').change(tcInputListener);

	// Listen for user click of time step buttons
	$('#tc-table, #tc-table2').on('click', '.js--tstep-button', tstepButtonListener);
});

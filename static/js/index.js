function updateEmbed(specPath, specURL, specID) {
	$.getJSON(specPath, function(spec) {
		spec.data[0].url = specURL;
		vega.embed(specID, spec);
	});
}

function getMappedColor(maxDegree, curDegree) {
	var hue = ((maxDegree - curDegree) * 120 / 100).toString(10);
	return ['hsl(', hue, ', 100%, 50%)'].join('');
}

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
		// Display nodes in a circle
		var allDegrees = s.graph.nodes().map(function(obj) {
			return s.graph.degree(obj.label);
		});
		var maxDegree = Math.max.apply(Math, allDegrees);

		s.graph.nodes().forEach(function(node, i, a) {
			node.x = Math.cos(Math.PI * 2 * i / a.length);
			node.y = Math.sin(Math.PI * 2 * i / a.length);
			node.size = s.graph.degree(node.id);
			node.color = getMappedColor(maxDegree, node.size);
		});

		// Start the layout algorithm, then stop after specified timeout
		s.startForceAtlas2({slowDown: 10});
		setTimeout(function() {
			s.stopForceAtlas2();
		}, 1000);
	});
}

function updateTable(dataURL, tableTemplID, tableID, g, restState, sigmaID) {
	$.getJSON(dataURL, function(data) {
		var output = $('#' + tableID);
		var template = $('#' + tableTemplID).html()
		var updatedData = Mustache.render(template, {
			"strucs": data,
			toFixed: function() {
				return function(num, render) { return parseFloat(render(num)).toFixed(4); }
			}
		});
		$('#' + tableID + '-data').remove();
		$('#' + tableID).append(updatedData);

		if (g) {
			var $tstepButton = $('#tc-table .js--tstep-button').first()
			var tstepChoice = $tstepButton.text();
			var strucIndex = $tstepButton.parents('tr').index();
			updateSigma('api/traverse/' + g.subject + '_' + restState + '_' + g.thresh.toString().replace('.', '') +
				'_' + g.tstep + '?tstep=' + tstepChoice +'&struc=' + strucIndex, sigmaID);
		}
	});
}

function getGraphParams() {
	return {
		'subject': $('#tc-input-subject').find('option:selected')[0].value,
		'thresh': $('#tc-input-thresh').find('option:selected')[0].value,
		'tstep': $('#tc-input-tstep').find('option:selected')[0].value
	};
}

function tcInputListener() {
	var g = getGraphParams();

	var pref = 'data/' + g.subject + '/' + g.subject + '_Rest+' + g.thresh + '-' + g.tstep + '.json';
	var pref2 = 'data/' + g.subject + '/' + g.subject + '_MindfulRest+' + g.thresh + '-' + g.tstep + '.json';

	var specs = {
		0: 'api/timesteps/' + g.subject + '_R_' + g.thresh.toString().replace('.', '') + '_' + g.tstep,
		1: pref + '?type=struc_distr',
		2: pref + '?type=node_distr',
		3: pref2 + '?type=struc_distr',
		4: pref2 + '?type=node_distr'
	};

	for (var i = 0; i < 5; ++i) {
		updateEmbed('static/specs/spec_v' + i.toString() + '.json', specs[i], '#view' + i.toString());
	}

	updateTable(pref, 'tc-table-template', 'tc-table', g, 'R', 'graph-rest');
	updateTable(pref2, 'tc-table2-template', 'tc-table2', g, 'MR', 'graph-mindful-rest');
}

function tstepButtonListener() {
	var g = getGraphParams();
	var tstepChoice = this.innerHTML;
	var strucIndex = $(this).parents('tr').index();
	var restState = $(this).parents('table').is('#tc-table') ? 'R' : 'MR';
	var sigmaID = (restState === 'R') ? 'graph-rest' : 'graph-mindful-rest';
	updateSigma('api/traverse/' + g.subject + '_' + restState + '_' + g.thresh.toString().replace('.', '') +
				'_' + g.tstep + '?tstep=' + tstepChoice +'&struc=' + strucIndex, sigmaID);
}

$(function() {
	// Initial embedding of Vega charts
	for (var i = 0; i < 5; ++i) {
		vega.embed('#view' + i.toString(), 'static/specs/spec_v' + i.toString() + '.json');
	}

	updateSigma('api/traverse/MH01_R_030_12?tstep=2&struc=0', 'graph-rest');
	updateSigma('api/traverse/MH01_MR_030_12?tstep=2&struc=0', 'graph-mindful-rest');

	// Initialization of full TimeCrunch summary tables
	updateTable('data/MH01/MH01_Rest+0.30-12.json', 'tc-table-template', 'tc-table', '', '', '');
	updateTable('data/MH01/MH01_MindfulRest+0.30-12.json', 'tc-table2-template', 'tc-table2', '', '', '');

	// Listen for user selection from dropdown menus
	$('#tc-input-subject, #tc-input-thresh, #tc-input-tstep').change(tcInputListener);

	// Listen for user click of time step buttons
	$('#tc-table, #tc-table2').on('click', '.js--tstep-button', tstepButtonListener);
});

function updateEmbed(spec_path, spec_url, spec_id) {
	$.getJSON(spec_path, function(spec) {
		spec.data[0].url = spec_url;
		vega.embed(spec_id, spec);
	});
}

function updateTable(data_url, table_templ_id, table_id) {
	$.getJSON(data_url, function(data) {
		var output = $('#' + table_id);
		var template = $('#' + table_templ_id).html()
		var updatedData = Mustache.render(template, {"strucs": data, toFixed: function() {
			return function(num, render) { return parseFloat(render(num)).toFixed(4); }
		}});
		$('#' + table_id + '-data').remove();
		$('#' + table_id).append(updatedData);
	});
}

function tcInputListener() {
	var subject = $('#tc-input-subject').find('option:selected')[0].value;
	var thresh = $('#tc-input-thresh').find('option:selected')[0].value;
	var tstep = $('#tc-input-tstep').find('option:selected')[0].value;

	var pref = 'data/' + subject + '/' + subject + '_Rest+' + thresh + '-' + tstep + '.json';
	var pref2 = 'data/' + subject + '/' + subject + '_MindfulRest+' + thresh + '-' + tstep + '.json';

	var specs = {
		0: 'api/timesteps/' + subject + '_R_' + thresh.toString().replace('.', '') + '_' + tstep,
		1: pref + '?type=struc_distr',
		2: pref + '?type=node_distr',
		3: pref2 + '?type=struc_distr',
		4: pref2 + '?type=node_distr'
	};

	for (var i = 0; i < 5; ++i) {
		updateEmbed('static/specs/spec_v' + i.toString() + '.json', specs[i], '#view' + i.toString());
	}

	updateTable(pref, 'tc-table-template', 'tc-table');
	updateTable(pref2, 'tc-table2-template', 'tc-table2');
}

function getMappedColor(maxDegree, curDegree) {
	var hue = ((maxDegree - curDegree) * 120 / 100).toString(10);
	return ['hsl(', hue, ', 100%, 50%)'].join('');
}

function updateSigma(data_url, container_id) {
	sigma.parsers.json(data_url, {
		container: container_id,
		renderer: {
			container: document.getElementById(container_id),
			type: 'canvas'
		},
		settings: {
			minNodeSize: 3,
			maxNodeSize: 6
		}
	}, function(s) {
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

$(function() {
	// Initial embedding of Vega charts
	for (var i = 0; i < 5; ++i) {
		vega.embed('#view' + i.toString(), 'static/specs/spec_v' + i.toString() + '.json');
	}

	updateSigma('api/traverse/MH01_R_030_12', 'graph-rest');
	updateSigma('api/traverse/MH01_MR_030_12', 'graph-mindful-rest');

	// Initialization of full TimeCrunch summary tables
	updateTable('data/MH01/MH01_Rest+0.30-12.json', 'tc-table-template', 'tc-table');
	updateTable('data/MH01/MH01_MindfulRest+0.30-12.json', 'tc-table2-template', 'tc-table2')

	// Listen for user selection from dropdown menus
	$('#tc-input-subject').change(tcInputListener);
	$('#tc-input-thresh').change(tcInputListener);
	$('#tc-input-tstep').change(tcInputListener);
});

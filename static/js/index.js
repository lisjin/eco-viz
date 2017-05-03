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
		var test_out = Mustache.render(template, {"strucs": data, toFixed: function() {
			return function(num, render) { return parseFloat(render(num)).toFixed(4); }
		}});
		$('#' + table_id + '-data').remove();
		$('#' + table_id).append(test_out);
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
	}

	for (var i = 0; i < 5; ++i) {
		updateEmbed('static/specs/spec_v' + i.toString() + '.json', specs[i], '#view' + i.toString());
	}

	updateTable(pref, 'tc-table-template', 'tc-table');
	updateTable(pref2, 'tc-table2-template', 'tc-table2');
}

$(function() {
	vega.embed('#view0', 'static/specs/spec_v0.json');
	vega.embed('#view1', 'static/specs/spec_v1.json');
	vega.embed('#view2', 'static/specs/spec_v2.json');
	vega.embed('#view3', 'static/specs/spec_v3.json');
	vega.embed('#view4', 'static/specs/spec_v4.json');

	updateTable('data/MH01/MH01_Rest+0.30-12.json', 'tc-table-template', 'tc-table');
	updateTable('data/MH01/MH01_MindfulRest+0.30-12.json', 'tc-table2-template', 'tc-table2')

	$('#tc-input-subject').change(tcInputListener);
	$('#tc-input-thresh').change(tcInputListener);
	$('#tc-input-tstep').change(tcInputListener);
});

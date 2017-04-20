function updateEmbed(spec_v1_url, spec_v2_url, spec_v3_url, spec_v4_url) {
	$.getJSON('static/specs/spec_v1.json', function(spec) {
		spec.data[0].url = spec_v1_url;
		vega.embed('#view1', spec);
	});
	$.getJSON('static/specs/spec_v2.json', function(spec) {
		spec.data[0].url = spec_v2_url;
		vega.embed('#view2', spec);
	});
	$.getJSON('static/specs/spec_v3.json', function(spec) {
		spec.data[0].url = spec_v3_url;
		vega.embed('#view3', spec);
	});
	$.getJSON('static/specs/spec_v4.json', function(spec) {
		spec.data[0].url = spec_v4_url;
		vega.embed('#view4', spec);
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
	var thresh = $('#tc-input-thresh').find('option:selected')[0].value;
	var tstep = $('#tc-input-tstep').find('option:selected')[0].value;

	var pref = 'data/pos_' + thresh + '-' + tstep + '.json'
	var pref2 = 'data/pos_MR_' + thresh + '-' + tstep + '.json'
	var spec_v1_url = pref + '?type=struc_distr'
	var spec_v2_url = pref + '?type=node_distr'
	var spec_v3_url = pref2 + '?type=struc_distr'
	var spec_v4_url = pref2 + '?type=node_distr'

	updateEmbed(spec_v1_url, spec_v2_url, spec_v3_url, spec_v4_url);
	updateTable(pref, 'tc-table-template', 'tc-table');
	updateTable(pref2, 'tc-table2-template', 'tc-table2');
}

$(function() {
	vega.embed('#view1', 'static/specs/spec_v1.json');
	vega.embed('#view2', 'static/specs/spec_v2.json');
	vega.embed('#view3', 'static/specs/spec_v3.json');
	vega.embed('#view4', 'static/specs/spec_v4.json');

	updateTable('data/pos_0.30-12.json', 'tc-table-template', 'tc-table');
	updateTable('data/pos_MR_0.30-12.json', 'tc-table2-template', 'tc-table2')

	$('#tc-input-thresh').change(tcInputListener);
	$('#tc-input-tstep').change(tcInputListener);
});

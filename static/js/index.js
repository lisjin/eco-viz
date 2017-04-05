function updateEmbed(spec_v1_url, spec_v2_url) {
	$.getJSON('static/specs/spec_v1.json', function(spec) {
		spec.data[0].url = spec_v1_url;
		vega.embed('#view1', spec);
	});
	$.getJSON('static/specs/spec_v2.json', function(spec) {
		spec.data[0].url = spec_v2_url;
		vega.embed('#view2', spec);
	});
}

function updateTable(data_url) {
	$.getJSON(data_url, function(data) {
		var output = $('#tc-table');
		var template = $('#tc-table-template').html()
		var test_out = Mustache.render(template, {"strucs": data, toFixed: function() {
			return function(num, render) { return parseFloat(render(num)).toFixed(4); }
		}});
		$('#tc-table-data').remove();
		$('#tc-table').append(test_out);
	});
}

function tcInputListener() {
	var thresh = $('#tc-input-thresh').find('option:selected')[0].value;
	var tstep = $('#tc-input-tstep').find('option:selected')[0].value;

	var pref = 'data/pos_' + thresh + '-' + tstep + '.json'
	var spec_v1_url = pref + '?type=struc_distr'
	var spec_v2_url = pref + '?type=node_distr'

	updateEmbed(spec_v1_url, spec_v2_url);
	updateTable(pref);
}

$(function() {
	vega.embed('#view1', 'static/specs/spec_v1.json');
	vega.embed('#view2', 'static/specs/spec_v2.json');
	updateTable('data/pos_0.30-12.json');

	$('#tc-input-thresh').change(tcInputListener);
	$('#tc-input-tstep').change(tcInputListener);
});

// CREDIT: https://bl.ocks.org/mbostock/3887235

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

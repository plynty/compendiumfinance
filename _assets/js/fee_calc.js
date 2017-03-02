var rateOfReturn = .07,
    rateFundFee = .0125,
    rateAdvisorFee = .01
    initial = 120000;

var data = [
    {"Year": 1, "You Keep":initial, "Fund Fees":initial*rateFundFee, "Advisor Fees":initial*rateAdvisorFee, "Lost Earnings":250}
];
data[0].total = data[0]["You Keep"] + data[0]["Fund Fees"] + data[0]["Advisor Fees"] + data[0]["Lost Earnings"];

for (var i = 1; i < 20; i++) {
    var row = {
        "Year": i+1,
        "You Keep": data[i-1]["You Keep"] * (1 + rateOfReturn - rateFundFee - rateAdvisorFee),
        "Fund Fees": data[i-1]["Fund Fees"] + data[i-1]["You Keep"] * rateFundFee,
        "Advisor Fees": data[i-1]["Advisor Fees"] + data[i-1]["You Keep"] * rateAdvisorFee,
        "Lost Earnings": data[i-1]["Lost Earnings"] * 1.30
    };
    row.total = row["You Keep"] + row["Fund Fees"] + row["Advisor Fees"] + row["Lost Earnings"];
    data.push(row);
}
data.columns = ["Year", "You Keep", "Fund Fees", "Advisor Fees", "Lost Earnings"];

function generateStack(svgSelector) {
    var aspect = 2.0
        svgW = $(svgSelector).parent().width(),
        svgH = svgW / aspect;
        $(svgSelector).width(svgW);
        $(svgSelector).height(svgH);
    var svg = d3.select(svgSelector),
        margin = { top: 20, right: 45, bottom: 30, left: 15 },
        width = svgW - margin.left - margin.right,
        height = svgH - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
        .rangeRound([0, width])
        .align(0.1);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var gradColors = [
            ["#338833", "#42bd41", "#88ff88"], // green
            ["#cc3200", "#ff4500", "#ff8800"], // red-1
            ["#992520", "#dd382f", "#ee6644"], // red-2
            ["#bb0000", "#ff0000", "#ff6666"]  // red-3
        ];

    var enterGrads = svg
        .insert("defs")
        .selectAll("linearGradient")
        .data(gradColors)
        .enter();
        
    var colorGrads = enterGrads.append("linearGradient")
        .attr("id", function(d, i) { return "gradLin" + i; })
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");
    colorGrads.append("stop")
        .attr("class", "dark")
        .attr("offset", "0%")
        .attr("stop-color", function(d, i) { return gradColors[i][0]; });
    colorGrads.append("stop")
        .attr("class", "color")
        .attr("offset", "25%")
        .attr("stop-color", function(d, i) { return gradColors[i][1]; });

    var hiLiGrads = enterGrads.append("linearGradient")
        .attr("id", function(d, i) { return "gradLinHL" + i; })
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");
    hiLiGrads.append("stop")
        .attr("class", "dark")
        .attr("offset", "0%")
        .attr("stop-color", function(d, i) { return gradColors[i][1]; });
    hiLiGrads.append("stop")
        .attr("class", "color")
        .attr("offset", "25%")
        .attr("stop-color", function(d, i) { return gradColors[i][2]; });

    // d3.csv("data.csv", function (d, i, columns) {
    //     for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
    //     d.total = t;
    //     return d;
    // }, function (error, data) {
    //     if (error) throw error;

        var keys = data.columns.slice(1);

        // data.sort(function (a, b) { 
        //     return a.Year - b.Year; 
        // });
        x.domain(data.map(function (d) { return d.Year; }));
        y.domain([0, d3.max(data, function (d) { return d.total; })]).nice();

        g.append("g")
            .selectAll("g")
            .data(d3.stack().keys(keys)(data))
            .enter().append("g")
                .attr("class", function (d, i) { return "grad-linear-"+i; })
            .selectAll("rect")
                .data(function (d) { 
                    d.forEach(function(element) {
                        element.key = d.key;
                    }); 
                    return d; 
                })
                .enter().append("rect")
                    .attr("x", function (d) { return x(d.data.Year); })
                    .attr("y", function (d) { return y(d[1]); })
                    .attr("height", function (d) { return y(d[0]) - y(d[1]); })
                    .attr("width", x.bandwidth())
                    .append("title").text(function(d) { return d.key+": "+d3.format("$,.0f")(d.data[d.key]); });

        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + width + ", 0)")
            .call(d3.axisRight(y).ticks(5, "$s"));
        // .append("text")
        // .attr("x", 2)
        // .attr("y", y(y.ticks().pop()) + 0.5);
        // .attr("dy", "0.32em")
        // .attr("fill", "#000");
        // .attr("font-weight", "bold")
        // .attr("text-anchor", "start")
        // .text("$");

        var legend = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", "10pt")
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(keys.slice().reverse())
            .enter().append("g")
            .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", 85)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", function(d, i) { return gradColors[gradColors.length-i-1][1] });

        legend.append("text")
            .attr("x", 80)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(function (d) { return d; });
    // });

}

function generatePie(pieId) {
    var aspect = 1.7
        svgW = $(pieId).parent().width(),
        svgH = svgW / aspect;
        $(pieId).width(svgW);
        $(pieId).height(svgH);

    var width = svgW,
        height = svgH,
        radius = Math.min(width, height) / 2;

    var values = data[data.length-1];
    var loseTotal = values["Fund Fees"] + values["Advisor Fees"] + values["Lost Earnings"];
    var keepTotal = values.total - loseTotal;

    var color = d3.scaleOrdinal()
        .domain(["You Keep", "You Lose"])
        .range([  // gradient triples: [lowlight, color, highlight]
            ["#373", "#3f3", "#6f6"], // green
            ["#944", "#f33", "#f66"] //red
        ]);

    var pieData = [
        { 
            label: color.domain()[0], 
            value: keepTotal,
            fmtValue: d3.format('$,.0f')(keepTotal),
            percent: d3.format('.0%')(keepTotal/values.total)
        },
        { 
            label: color.domain()[1], 
            value: loseTotal,
            fmtValue: d3.format('$,.0f')(loseTotal),
            percent: d3.format('.0%')(loseTotal/values.total)
        }
    ];

    var pie = d3.pie()
        .sort(null)
        .value(function (d) {
            return d.value;
        });

    var enterGrads = d3.select(pieId)
        .append("defs")
        .selectAll("radialGradient")
        .data(pie(pieData), function(d, i){ return "grad" + i; })
        .enter();
        
    var colorGrads = enterGrads.append("radialGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", "75%")
        .attr("id", function(d, i) { return "grad" + i; });
    colorGrads.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function(d, i) { return color(i)[1]; });
    colorGrads.append("stop")
        .attr("offset", "85%")
        .attr("stop-color", function(d, i) { return color(i)[0]; });

    var hiLiGrads = enterGrads.append("radialGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", "75%")
        .attr("id", function(d, i) { return "gradHL" + i; });
    hiLiGrads.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function(d, i) { return color(i)[2]; });
    hiLiGrads.append("stop")
        .attr("offset", "75%")
        .attr("stop-color", function(d, i) { return color(i)[1]; });

    var svg = d3.select(pieId)
        .append("g")

    svg.append("g")
        .attr("class", "slices");
    svg.append("g")
        .attr("class", "labels");
    svg.append("g")
        .attr("class", "lines");

    var arc = d3.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(0);

    var outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var key = function (d) { 
        return d.data.label; 
    };

    change(pieData);

    function change(pieData) {

        /* ------- PIE SLICES -------*/
        var slice = svg.select(".slices").selectAll("path.slice")
            .data(pie(pieData), key);

        slice.exit()
            .remove();

        var paths = slice.enter()
            .insert("path")
            .attr("class", "slice")
            .attr("class", function (d, i) { return "grad-radial-"+i; })
            .attr("fill", function (d, i) { return "url(#grad"+i+")"; });

        paths.merge(slice)
            .transition().duration(1000)
            .attrTween("d", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    return arc(interpolate(t));
                };
            })
        paths.append("title").text(function(d) { return "Total: " + d.data.fmtValue; });
        
        /* ------- TEXT LABELS -------*/

        var text = svg.select(".labels").selectAll("text")
            .data(pie(pieData), key);

        function midAngle(d) {
            return d.startAngle + (d.endAngle - d.startAngle) / 2;
        }

        var textMerge = text.enter()
            .append("text")
            .attr("dy", ".35em")
          .merge(text);
        
        textMerge.html(function (d) {
                var html = '<tspan class="pie-label" x="0" dy="1.4rem">'+d.data.label+"</tspan>";
                html += '<tspan class="amount" x="0" dy="1.4rem">'+d.data.fmtValue+'</tspan>';
                html += '<tspan class="percent" x="0" dy="1.4rem">'+d.data.percent+'</tspan>';
                return html;
            });

        textMerge.transition().duration(1000)
            .attrTween("transform", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    var d2 = interpolate(t);
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                    pos[1] -= 10; // adjust for multi-line text
                    return "translate(" + pos + ")";
                };
            })
            .styleTween("text-anchor", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start" : "end";
                };
            });

        text.exit()
            .remove();

        /* ------- SLICE TO TEXT POLYLINES -------*/

        var polyline = svg.select(".lines").selectAll("polyline")
            .data(pie(pieData), key);

        polyline.enter()
            .append("polyline")
          .merge(polyline)

        .transition().duration(1000)
            .attrTween("points", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    var d2 = interpolate(t);
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc.centroid(d2), outerArc.centroid(d2), pos];
                };
            });

        polyline.exit()
            .remove();
    };
}

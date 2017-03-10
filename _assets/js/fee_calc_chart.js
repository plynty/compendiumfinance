'use strict';

var config = {

    keys: ["You Keep", "Fund Fees", "Advisor Fees", "Lost Earnings"],
    pieKeys: ["You Keep", "You Lose"],

    colors: [
        "#42bd41", // green
        "#ff4500", // red-1
        "#dd382f", // red-2
        "#ff0000"  // red-3
    ],
    pieColors: [  // gradient triples: [lowlight, color, highlight]
        ["#373", "#3f3", "#6f6"], // green
        ["#944", "#f33", "#f66"] //red
    ],
    legend: {
        top: -8,
        left: 0,
        lineHeight: 20,
        labelsRight: 60,
        totalsRight: 100
    },
    
    showPie: false
}

/** hold context info for all the charts on the page */
var charts = {};

/**
 * Perform initial setup for a stack chart, then render the chartbased on initial data
 */
function generateCharts(svgSelector, style, curve) {
     // create a new chart context
    charts[svgSelector] = {
        style: style,
        curve: curve
    };
    var geom = createChartGeometry(svgSelector);

    svgDefs(geom.svg);
    initAxes(svgSelector);
    initOverlay(svgSelector);
    initLegend(svgSelector);
    initPie(svgSelector);

    /** validate the inputs, will trigger a render */
    validate();
}

/**
 * 
 * @param {*} svgSelector 
 */
function updateStack(svgSelector) {
    var chartCtx = charts[svgSelector];
    if (!chartCtx) {
        return;
    }
    
    var geom = chartCtx.geom;
    fetchData(function (error, data) {
        if (error) {
            throw error;
        }

        renderAxes(svgSelector, data);
        switch (chartCtx.style) {
            case "barStack":
                renderBarStack(svgSelector, data);
                break;
            case "areaStack":
                renderAreaStack(svgSelector, data);
                break;
        }
        renderLegend(svgSelector, data);
    });
}

function toggleChart(checkbox, svgSelector) {
    var chartCtx = charts[svgSelector];
    config.showPie = checkbox.checked;
    var opacity = config.showPie ? 0 : 1;

    function fade(selection, opacity) {
        selection.transition().duration(1500)
            .attr("opacity", opacity);
            // .attr("stroke-opacity", opacity);
    }
    fade(chartCtx.geom.topG.select(".stack-chart"), opacity);
    fade(chartCtx.geom.topG.select(".pie-chart"), 1 - opacity);
}

/**
 * Create a top-level <g> element within the <svg> element.  This
 * <g> element will contian all the drawing elements.  The <g> element
 * will maximize the space in the container but retain the optimal aspect
 * ratio for the chart.  
 * @param svgSelector CSS selector that uniquely identifies the <svg> element
 * @return A structure containing key geometry items:
 * { 
 * svg: // the svg element found by d3.select(svgSelector)
 * topG: the top-level <g> element, centered within the container
 * width: the width of the drawable area
 * height: the height of the drawable area
 * }
 */
function createChartGeometry(svgSelector, margin) {
    // clear anything that was there before
    $(svgSelector + " > *").remove();
    if (!margin) {
        margin = { top: 20, right: 45, bottom: 40, left: 15 };
    }
    var aspect = 1.5,
        size = maxSize($(svgSelector).parent(), aspect, margin),
        width = size.chartW,
        height = size.chartH;
    var svg = d3.select(svgSelector),
        defs = svg.append("defs"),
        topG = svg.append("g"),
        chartG = topG.append("g")
            .attr("class", "stack-chart")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("opacity", config.showPie ? 0 : 1),
        graphG = chartG.append("g")
            .attr("class", "graph"),
        legendG = chartG.append("g")
            .attr("class", "legend"),
        pieG = topG.append("g")
            .attr("class", "pie-chart")
            .attr("opacity", config.showPie ? 1 : 0);

    /* the viewBox is the 'natural' size of the drawing.  When the browser
        scales the drawing up and down, it will be relative to this size.  A resize
        does not trigger a re-rendering of the vectors.  It looks like a 
        simple bitmap resize, so linesget fatter/thinner, etc.  We need to
        detect resize events in order to fire the rendering process again  */        
    svg.attr("viewBox", "0 0 "+size.w+" "+size.h); 

    charts[svgSelector].geom = {
        svg: svg,
        defs: defs,
        topG: topG,
        chartG: chartG,
        legendG: legendG,
        pieG: pieG,
        width: width,
        height: height
    }
    return charts[svgSelector].geom;
}

/**
 * Perform 1-time setup of chart axes
 */
function initAxes(svgSelector) {
    var chartCtx = charts[svgSelector];
    var geom = chartCtx.geom;
    switch (chartCtx.style) {
        case "barStack":
            var xScale = d3.scaleBand()
                .rangeRound([0, geom.width])
                .align(0.1)
            break;
        default:
            var xScale = d3.scaleLinear()
                .range([0, geom.width])
            break;
    }

    var yScale = d3.scaleLinear()
        .rangeRound([geom.height, 0]);

    var g = geom.chartG;
    g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + chartCtx.geom.height + ")");

    g.append("g")
        .attr("class", "axis y-axis")
        .attr("transform", "translate(" + chartCtx.geom.width + ", 0)");

    g.append("g")
        .attr("class", "x-axis-label")
        .attr("transform", "translate(" + (chartCtx.geom.width / 2) + ", " + (chartCtx.geom.height + 33) + ")")
        .append("text").text("Years");

    chartCtx.xScale = xScale;
    chartCtx.yScale = yScale;
}

/**
 * Render the vertical and horizontal axes
 * @param g the <g> element where the axes should be rendered
 * @param data The chart data (determines max limits of the axes)
 * @param geom The gemoetry object created by createChartGeometry()
 * @return {x: xScale, y: yScale}
 */
function renderAxes(svgSelector, data) {//g, data, geom, style) {
    var chartCtx = charts[svgSelector];
    switch (chartCtx.style) {
        case "barStack":
            chartCtx.xScale.domain(data.map(function (d) { return d.Year; }));
            break;
        default:
            chartCtx.xScale.domain([1, data.length]);
            break;
    }

    chartCtx.yScale.domain([0, d3.max(data, function (d) { return d.total; })]).nice();

    var g = chartCtx.geom.chartG;

    // determine whether axis numbers need to be removed for space considerations
    var minNumberPx = 15;
    var tickGap = 1;
    var tickWidth = chartCtx.geom.width / (data.length-1);
    while (tickWidth * tickGap < minNumberPx) {
        tickGap++;
    }
    var t = g.transition().duration(2000);
    t.select(".x-axis")
        .call(d3.axisBottom(chartCtx.xScale)
            .ticks(data.length)
            .tickFormat(function(tick) {
                if (tickGap == 1 || tick == 1 || tick == data.length) {
                    return tick;
                }
                if (tick % tickGap == 0 && (data.length - tick) * tickWidth >= minNumberPx) {
                    return tick;
                }
                return "";
            })
        );
    t.select(".y-axis")
        .call(d3.axisRight(chartCtx.yScale)
            .ticks(5, "$s"));
}

/**
 * Render the legend in the specified <g> element, with the 
 * given x,y offset
 * @param g The <g> element to contain the legend
 * @param x The x-offset relative to <g>
 * @param y The y-offset relative to <g>
 */
function initLegend(svgSelector) {
    var chartCtx = charts[svgSelector];
    var legendG = chartCtx.geom.legendG;
    legendG.attr("text-anchor", "end")
        .attr("transform", "translate("+config.legend.left+", "+config.legend.top+")");

    legendG.append("rect")
        .attr("class", "mask")
        .attr("x", -8).attr("y", -5)
        .attr("width", config.legend.totalsRight+config.legend.labelsRight + 16)
        .attr("height", config.legend.lineHeight * config.keys.length + 10)
        .attr("rx", 20).attr("ry", 15);

    var legend = legendG
        .selectAll("g")
        .data(config.keys.slice().reverse())
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(0," + i * config.legend.lineHeight + ")"; });

    legend.append("rect")
        .attr("class", "color-key")
        .attr("x", config.legend.labelsRight + 5)
        .attr("width", 19)
        .attr("height", 19)
        .attr("class", function(d, i) { return "legend-"+(config.keys.length-1-i) });

    legend.append("text")
        .attr("class", "legend-label")
        .attr("x", config.legend.labelsRight)
        .attr("y", 10)
        .attr("dy", "0.32em")
        .text(function (d) { return d; });
}

/**
 * Update the variable portion of the legend: the totals
 */
function renderLegend(svgSelector, data) {
    var chartCtx = charts[svgSelector];

    var grandTotal = data[data.length-1].total;

    chartCtx.geom.legendG.selectAll(".total").remove();
    var totalEnter = chartCtx.geom.legendG.selectAll(".total")
        .data(d3.stack().keys(config.keys.slice().reverse())(data))
        .enter().append("g")
        .attr("class", "total")
        .attr("transform", function (d, i) { return "translate("+config.legend.totalsRight+"," + i * config.legend.lineHeight + ")"; });
    var percentages = totalEnter
        .append("text")
        .attr("class", "percent")
        .attr("x", 8)
        .attr("y", 10)
        .attr("dy", "0.32em");
    var values = totalEnter
        .append("text")
        .attr("class", "value")
        .attr("x", config.legend.labelsRight)
        .attr("y", 10)
        .attr("dy", "0.32em");

    percentages.merge(percentages)
        .text(function(d) {
            return d3.format(".0%")(d[d.length-1].data[d.key] / grandTotal);
        });
    values.merge(values)
        .text(function(d) {
            return d3.format("$,.0f")(d[d.length-1].data[d.key]);
        });
}

function initOverlay(svgSelector) {
    var chartCtx = charts[svgSelector];

    var g = chartCtx.geom.chartG.append("g")
        .attr("class", "chart-overlay");
    chartCtx.geom.overlayG = g;
}

/**
 * Render a stacked bar chart
 * @param g The <g> element to receive the chart
 * @param data The chart data
 * @param scale The x & y scale axes
 */
function renderBarStack(svgSelector, data) {
    var chartCtx = charts[svgSelector];
    var g = chartCtx.geom.chartG;
    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(config.keys)(data))
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
                .attr("x", function (d) { return chartCtx.xScale(d.data.Year); })
                .attr("y", function (d) { return chartCtx.xScale(d[1]); })
                .attr("height", function (d) { return chartCtx.xScale(d[0]) - chartCtx.yScale(d[1]); })
                .attr("width", chartCtx.xScale.bandwidth())
                .append("title").text(function(d) { return d.key+": "+d3.format("$,.0f")(d.data[d.key]); });
}

/**
 * Render a stacked bar chart
 * @param g The <g> element to receive the chart
 * @param data The chart data
 * @param scale The x & y scale axes
 * @param curve The curve function for interpolating points
 */
function renderAreaStack(svgSelector, data) {
    var chartCtx = charts[svgSelector];
    var stack = d3.stack();

    var area = d3.area()
        .x(function(d, i) { 
            return chartCtx.xScale(d.data.Year/*i+1*/); 
        })
        .y0(function(d) { return chartCtx.yScale(d[0]); })
        .y1(function(d) { return chartCtx.yScale(d[1]); });

    var line1 = d3.line()
        .x(function(d, i) { 
            return chartCtx.xScale(d.data.Year/*i+1*/); 
        })
        .y(function(d) { return chartCtx.yScale(d[1]); });
    
    switch(chartCtx.curve) {
        case "cardinal":
            area.curve(d3.curveCardinal.tension(0));
            line1.curve(d3.curveCardinal.tension(0));
            break;
        case "catmullrom":
            area.curve(d3.curveCatmullRom.alpha(0.5));
            line1.curve(d3.curveCatmullRom.alpha(0.5));
            break;
        case "natural":
            area.curve(d3.curveNatural);
            line1.curve(d3.curveNatural);
            break;
        case "basis":
            area.curve(d3.curveBasis);
            line1.curve(d3.curveBasis);
            break;
    }

    fetchData(function (error, data) {
        if (error) {
            throw error;
        }

        // thin out the data if the points are too dense for a smooth curve
        var minPointDist = 20;
        var pointGap = 1;
        var pointDist = chartCtx.geom.width / (data.length-1);
        while (pointDist * pointGap < minPointDist) {
            pointGap++;
        }
        var thinData = [];
        if (pointGap == 1) {
            // if all the points are included, just use the raw data
            thinData = data;
        } else {
            // copy the column defs
            thinData.columns = data.columns;
            // iterate through the data points, add only those that meet the minimum point distance
            for (var i = 0; i < data.length; i++) {
                if (i == 0 || i == data.length-1) {
                    thinData.push(data[i]);
                } else if (i % pointGap == 0 && (data.length - 1 - i) * pointDist >= minPointDist) {
                    thinData.push(data[i]);
                }
            }
        }

        stack.keys(config.keys);

        // a 'layer' is one tier of the stack
        var layers = chartCtx.geom.chartG.select(".graph").selectAll(".layer");
        var layer = layers.data(stack(thinData));

        layer.exit().remove();

        // draw the areas
        layer.enter().append("g")
            .attr("class", function(d, i) { return "layer area-"+i; } )//;
            .append("path")
                .attr("class", function(d, i) { return "area area-"+i; })
                .attr("d", area);

        var path = layer.select("path");
        path.merge(path).transition().duration(2000)
            .attr("d", area);

        // draw the lines at the top of the areas, using the same curve
        var lines = chartCtx.geom.chartG.select(".graph").selectAll(".line")
            .data(stack(thinData));
        lines.enter().append("path")
            .attr("class", function(d, i) { return "line line"+i; })
            .attr("fill", "none")
            .merge(lines).transition().duration(2000)
            .attr("d", line1);

        // draw the vertical guides on the overlay
        chartCtx.geom.overlayG.selectAll(".column").remove();
        var verticals = chartCtx.geom.overlayG.selectAll(".column")
            .data(stack(data))
            .enter()
            .append("g")
            .attr("class", function(d,i){ return "column line"+i; })
            .selectAll("line")
            .data(function(d, i) {
                // var line = d3.line();
                return d;
            })
            .enter()
            .append("path")
            .attr("class", "vertical")
            .attr("d", function(d, i, data) {
                var x = area.x()(d, i);
                var y0 = area.y0()(d);
                var y1 = area.y1()(d);
                return "M"+x+" "+y0+" V"+y1;
            })
            .attr("fill", "none");
    });
}

/**
 * Append a <defs> section to the <svg> element containing 
 * <linearGradient> definitions for each chart color.  Two
 * sets of gradients are created, normal and highlighted.
 * @param svg The <svg> element from d3.select()
 * @param gradColors 2-d array of colors, each row containing
 * 3 colors, a lowlight, normal, and highlight color for the gradient.
 * If not provided a default is applied.
 */
function svgDefs(svg) {
    var gradColors = [
        ["#338833", "#42bd41", "#88ff88"], // green
        ["#cc3200", "#ff4500", "#ff8800"], // red-1
        ["#992520", "#dd382f", "#ee6644"], // red-2
        ["#bb0000", "#ff0000", "#ff6666"]  // red-3
    ];
    var defs = svg.select("defs");

    // define linear gradients
    var linears = defs
        .selectAll("linearGradient")
        .data(gradColors)
        .enter();
        
    var colorGrads = linears.append("linearGradient")
        .attr("id", function(d, i) { return "gradLin" + i; })
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");
    colorGrads.append("stop")
        .attr("class", "dark")
        .attr("offset", "0%")
        .attr("stop-color", function(d, i) { return config.colors[i][0]; });
    colorGrads.append("stop")
        .attr("class", "color")
        .attr("offset", "25%")
        .attr("stop-color", function(d, i) { return gradColors[i][1]; });

    var hiLiGrads = linears.append("linearGradient")
        .attr("id", function(d, i) { return "gradLinHL" + i; })
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");
    hiLiGrads.append("stop")
        .attr("class", "dark")
        .attr("offset", "0%")
        .attr("stop-color", function(d) { return d[1]; });
    hiLiGrads.append("stop")
        .attr("class", "color")
        .attr("offset", "25%")
        .attr("stop-color", function(d) { return d[2]; });

    // define radial gradients
    var radials = defs
        .selectAll("radialGradient")
        .data(d3.pie()(config.pieColors), function(d, i){ return "grad" + i; })
        .enter();
        
    var colorGrads = radials.append("radialGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", "75%")
        .attr("id", function(d, i) { return "grad" + i; });
    colorGrads.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function(d) { return d.data[1]; });
    colorGrads.append("stop")
        .attr("offset", "85%")
        .attr("stop-color", function(d) { return d.data[0]; });

    var hiLites = radials.append("radialGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", "75%")
        .attr("id", function(d, i) { return "gradHL" + i; });
    hiLites.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function(d) { return d.data[2]; });
    hiLites.append("stop")
        .attr("offset", "75%")
        .attr("stop-color", function(d) { return d.data[1]; });
}
/**
 * 
 */
function initPie(svgSelector) {
    var chartCtx = charts[svgSelector];

    var parentH = $(svgSelector).parent().innerHeight();
    var targetAspect = (parentH + 375) / parentH,
        margin = { top: 0, right: 0, bottom: 0, left: 0 };
    var size = maxSize($(svgSelector).parent(), targetAspect, margin, true);
    var width = size.w,
        height = size.h;
    chartCtx.radius = Math.min(width, height) / 2;

    var centerX = size.parentW / 2 - 30, // don't know where this offset of 30 comes from!?!?
        centerY = size.parentH / 2 - 30;
        chartCtx.geom.pieG.attr("transform", "translate(" + centerX + "," + centerY + ")");

    chartCtx.colorScale = d3.scaleOrdinal()
        .domain(config.pieKeys)
        .range(config.pieColors);

    var g = chartCtx.geom.pieG;
    g.append("g")
        .attr("class", "slices");
    g.append("g")
        .attr("class", "labels");
    g.append("g")
        .attr("class", "lines");
}

function updatePie(svgSelector) {
    var chartCtx = charts[svgSelector];
    var color = chartCtx.colorScale;

    fetchData(function(error, data) {
        var values = data[data.length-1];
        var loseTotal = values["Fund Fees"] + values["Advisor Fees"] + values["Lost Earnings"];
        var keepTotal = values.total - loseTotal;

        var pieData = [
            { 
                label: config.pieKeys[0], 
                value: keepTotal,
                fmtValue: d3.format('$,.0f')(keepTotal),
                percent: d3.format('.0%')(keepTotal/values.total)
            },
            { 
                label: config.pieKeys[1], 
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

        var arc = d3.arc()
            .outerRadius(chartCtx.radius * 0.8)
            .innerRadius(0);

        var outerArc = d3.arc()
            .innerRadius(chartCtx.radius * 0.9)
            .outerRadius(chartCtx.radius * 0.9);

        var key = function (d) { 
            return d.data.label; 
        };

        var g = chartCtx.geom.pieG;
        /* ------- PIE SLICES -------*/
        var slice = g.select(".slices").selectAll(".slice")
            .data(pie(pieData)/*, key*/);

        slice.exit()
            .remove();

        var slices = slice.enter()
            .append("path")
            .attr("class", function (d, i) { return "slice grad-radial-"+i; })
            .attr("fill", function (d, i) { return "url(#grad"+i+")"; });

        slices.merge(slice)
            .transition().duration(1000)
            .attrTween("d", function (d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    var d2 = interpolate(t);
                    return arc(d2);
                };
            });
        slices.append("title").text(function(d) { return "Total: " + d.data.fmtValue; });
        
        /* ------- TEXT LABELS -------*/

        var text = g.select(".labels").selectAll("text")
            .data(pie(pieData), key);

        function midAngle(d) {
            return d.startAngle + (d.endAngle - d.startAngle) / 2;
        }

        var textMerge = text.enter()
            .append("text")
        .merge(text);
        
        textMerge.html(function (d) {
                var html = '<tspan class="pie-label" x="0">'+d.data.label+"</tspan>";
                html += '<tspan class="amount" x="0" y="20">'+d.data.fmtValue+'</tspan>';
                html += '<tspan class="percent" x="0" y="40">'+d.data.percent+'</tspan>';
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
                    pos[0] = chartCtx.radius * (midAngle(d2) < Math.PI ? 1 : -1);
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

        var polyline = g.select(".lines").selectAll("polyline")
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
                        pos[0] = chartCtx.radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                        return [arc.centroid(d2), outerArc.centroid(d2), pos];
                    };
                });

        polyline.exit()
            .remove();
    });
}

/**
 * Based on the size of the parent element, determine the maximum size
 * that can can contain a rect of with the desired aspect ratio.
 * @param parent
 * @param aspectRatio
 * @param margin The margin, top, right, bottom, left.  Note this is not
 * a clear margin like a CSS margin: it just constrains the size of the 
 * graphing area, not including the axes.  the axes are drawn into the
 * margin area.  This makes the calculation a little weird, but it is 
 * easier for d3 to compute scale distances.
 * @param mustFit If true, then the box is not allowed to grow
 * @return Object containing multiple sizes: 
 * w,h: total svg drawing size, including axes
 * chartW,chartH: area where the main chart resides, without axes
 * parentW,parentH: total inner area of the parent container.
 * 
 */
function maxSize(parent, aspectRatio, margin, mustFit) {
    if (!margin) {
        margin = {top: 10, right: 10, bottom: 10, left: 10};
    }
    var parentW = parent.innerWidth(),
        parentH = parent.innerHeight(),
        w = parentW - margin.left - margin.right,
        h = parentH - margin.top - margin.bottom;
    if (w / h < aspectRatio) {
        // the area is too too tall/narrow
        if (mustFit) {
            h = w / aspectRatio;  // shrink the height
        } else {
            w = aspectRatio * h;  // grow the width
        }
    } else {
        // the area is too short/wide
        if (mustFit) {
            w = h * aspectRatio;  // shrink the width
        } else {
            h = w / aspectRatio;  // grow the height
        }
    }
    return {
        w: w, h: h, 
        parentW: parentW, parentH: parentH,
        chartW: w - margin.left - margin.right,
        chartH: h - margin.top - margin.bottom
    };
}


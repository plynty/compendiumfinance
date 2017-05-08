/* global d3 */

'use strict';

// Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;

var config = {
  minChartWidth: 300,
  maxChartWidth: 500,
  aspectRatio: 1.5,
  margin: {top: 10, right: 45, bottom: 40, left: 15}, // margin for d3 area chart to draw axes
  curve: 'basis',

  keys: ["You Keep", "Fund Fees", "Advisor Fees", "Lost Earnings"],
  pieKeys: ["You Keep", "You Lose"],

  colors: [
    "#3f3", // green
    "#f33", // red-1
    "#f33", // red-2
    "#f33"  // red-3
  ],
  pieColors: [// gradient triples: [lowlight, color, highlight]
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

  showing: "area"
};

/** hold geometry info for the charts */
var geom;

/**
 * Perform initial setup for a stack chart, then render the chart based on initial data
 * @param {String} chartDivSelector CSS selector of the top-level div for charts
 */
function generateCharts(chartDivSelector) {

  createChartGeometry(chartDivSelector);

  svgDefs();
  initAxes();
  initLegend();
  initPie();
  initTable();


  /** validate the inputs, will trigger a render */
  validate();
  shadeButtons();
}

/**
 *
 */
function updateStack() {
  if (!geom) {
    return;
  }

  fetchData(function (error, data) {
    if (error) {
      throw error;
    }

    renderAxes(data);
    renderAreaStack(data);
    renderLegend(data);
  });
}

function swipeChart(leftRight) {
  switch (config.showing) {
    case 'area':
      config.showing = leftRight === 'right' ? 'bar' : 'pie';
      break;
    case 'pie':
      config.showing = leftRight === 'right' ? 'area' : 'bar';
      break;
    case 'bar':
      config.showing = leftRight === 'right' ? 'pie' : 'area';
      break;
  }
  showChart(config.showing);
}

function showChart(chartType) {
  config.showing = chartType;

  function fadeSvg(selection, opacity) {
    selection.transition().duration(1000)
            .attr("opacity", opacity);
  }
  function fadeDiv(selection, opacity) {
    selection.transition().duration(1000)
            .style("opacity", opacity);
  }
  fadeDiv(geom.area.topDiv, (config.showing === 'all' || config.showing === 'area') ? 1 : 0);
  fadeDiv(geom.pie.topDiv, (config.showing === 'all' || config.showing === 'pie') ? 1 : 0);
  fadeDiv(geom.bar.topDiv, (config.showing === 'all' || config.showing === 'bar') ? 1 : 0);
  shadeButtons();
}

function shadeButtons() {
  $('.chart-rotate .btn-group .btn').each(function () {
    if ($(this).hasClass('chart-' + config.showing)) {
      $(this).find('div.shade').hide();
    } else {
      $(this).find('div.shade').show();
    }
  });
}

/**
 * Create a top-level <g> element within the <svg> element.  This
 * <g> element will contian all the drawing elements.  The <g> element
 * will maximize the space in the container but retain the optimal aspect
 * ratio for the chart.
 * @param chartDivSelector CSS selector that uniquely identifies the <svg> element
 * @return A structure containing key geometry items:
 * {
 * svg: // the svg element found by d3.select(svgSelector)
 * width: the width of the drawable area
 * height: the height of the drawable area
 * }
 */
function createChartGeometry(chartDivSelector) {
  // clear anything that was there before
  // $(svgSelector + " > *").remove();
  var size = maxSize($(chartDivSelector), true),
          width = size.chartW,
          height = size.chartH;

  var areaGeom = {},
      pieGeom = {},
      barGeom = {};
  var chartDiv = d3.select(chartDivSelector);

  // construct area chart geom
  areaGeom.topDiv = chartDiv.select('.area-chart')
      .style("left", size.xOffsets[0]+'px')
      .style("opacity", (config.showing === 'all' || config.showing === 'area') ? 1 : 0);
  areaGeom.svg = areaGeom.topDiv.select('svg')
      .attr("width", size.w)
      .attr("height", size.h)
      .append("svg")
      .attr("viewBox", -config.margin.left + " " +
          -config.margin.top + " " +
          (width + config.margin.left + config.margin.right) + " " +
          (height + config.margin.top + config.margin.bottom));
  areaGeom.defs = areaGeom.svg.append("defs");
  areaGeom.g = areaGeom.svg.append("g")
      .attr("class", "stack-chart");
  areaGeom.overlay = areaGeom.topDiv.select('.chart-overlay');
  areaGeom.overlay.append("div")
      .attr("class", "legend")
      .style("position", "absolute");
//          .style("width", width + "px")
//          .style("height", height + "px"),

  // construct pie chart geom
  pieGeom.topDiv = chartDiv.select('.pie-chart')
      .style("left", size.xOffsets[1]+'px')
      .style("opacity", (config.showing === 'all' || config.showing === 'pie') ? 1 : 0);
  pieGeom.svg = pieGeom.topDiv.select('svg')
      .attr("class", "graph")
      .attr("viewBox", "0 0 " + width + " " + height);
  pieGeom.defs = pieGeom.svg.append("defs");
  pieGeom.g = pieGeom.svg.append("g")
      .attr("class", "pie-chart");
  pieGeom.overlay = pieGeom.topDiv.select('.chart-overlay');

  // construct bar chart geom
  barGeom.topDiv = chartDiv.select('.bar-chart')
      .style("left", size.xOffsets[2]+'px')
      .style("opacity", (config.showing === 'all' || config.showing === 'bar') ? 1 : 0);
  barGeom.svg = barGeom.topDiv.select('svg')
      .attr("class", "graph")
      .attr("viewBox", "0 0 " + width + " " + height);
  barGeom.defs = barGeom.svg.append("defs");
  barGeom.g = barGeom.svg.append("g")
    .attr("class", "pie-chart");
  barGeom.overlay = barGeom.topDiv.select('.chart-overlay');
//  barGeom.overlay.attr("class", "table")
//    .style("position", "absolute")
//    .style("top", "0px")
//    .style("left", "0px")
//    .style("min-width", size.w + "px")
//    .style("min-height", size.h + "px");

  chartDiv.selectAll('.chart-segment')
      .style('width', size.chartW+'px')
      .style('height', size.chartH+'px');

  /* the viewBox is the 'natural' size of the drawing.  When the browser
   scales the drawing up and down, it will be relative to this size.  A resize
   does not trigger a re-rendering of the vectors.  It looks like a
   simple bitmap resize, so linesget fatter/thinner, etc.  We need to
   detect resize events in order to fire the rendering process again  */

  chartDiv.style('height', size.h+'px')
      .style('width', size.totalW+'px');
  // svg.attr("viewBox", "0 0 "+size.totalW+" "+size.h);
//  svg.attr("width", size.totalW).attr("height", size.h);

  geom = {
    chartDiv: chartDiv,
    area: areaGeom,
    pie: pieGeom,
    bar: barGeom,
    width: width,
    height: height
  };
  return geom;
}

/**
 * Perform 1-time setup of chart axes
 */
function initAxes() {
  if (!geom) {
    return;
  }
  geom.area.xScale = d3.scaleLinear()
      .range([0, geom.width]);

  geom.area.yScale = d3.scaleLinear()
          .rangeRound([geom.height, 0]);

  var g = geom.area.g;
  g.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", "translate(0," + geom.height + ")");

  g.append("g")
          .attr("class", "axis y-axis")
          .attr("transform", "translate(" + geom.width + ", 0)");

  g.append("g")
          .attr("class", "x-axis-label")
          .attr("transform", "translate(" + (geom.width / 2) + ", " + (geom.height + 33) + ")")
          .append("text").text("Years");

}

/**
 * Render the vertical and horizontal axes
 * @param data The chart data (determines max limits of the axes)
 * @return {x: xScale, y: yScale}
 */
function renderAxes(data) {
  if (!geom) {
    return;
  }
  geom.area.xScale.domain([1, data.length]);

  geom.area.yScale.domain([0, d3.max(data, function (d) {
      return d.total;
    })]).nice();

  var g = geom.area.g;

  // determine whether axis numbers need to be removed for space considerations
  var minNumberPx = 15;
  var tickGap = 1;
  var tickWidth = geom.width / (data.length - 1);
  while (tickWidth * tickGap < minNumberPx) {
    tickGap++;
  }
  var t = g.transition().duration(2000);
  t.select(".x-axis")
      .call(d3.axisBottom(geom.area.xScale)
          .ticks(data.length)
          .tickFormat(function (tick) {
            if (tickGap === 1 || tick === 1 || tick === data.length) {
              return tick;
            }
            if (tick % tickGap === 0 && (data.length - tick) * tickWidth >= minNumberPx) {
              return tick;
            }
            return "";
          })
      );
  t.select(".y-axis")
      .call(d3.axisRight(geom.area.yScale)
          .ticks(5, "$s"));
}

/**
 * Render the legend in the specified <g> element, with the
 * given x,y offset
 */
function initLegend() {
  if (!geom) {
    return;
  }
  var legendDiv = geom.area.overlay;

  var table = legendDiv.append("xhtml:table");

  var tr = table.append("xhtml:tr").attr("class", "lose");
  tr.append("xhtml:td").attr("class", "legend-key-lose").append("xhtml:div");
  tr.append("xhtml:td").attr("class", "legend-label").text("You Lose:");
  tr.append("xhtml:td").attr("id", "legend-lose").attr("class", "legend-value");
  tr.append("xhtml:td").attr("id", "legend-lose-percent").attr("class", "legend-percent");

  tr = table.append("xhtml:tr").attr("class", "keep");
  tr.append("xhtml:td").attr("class", "legend-key-keep").append("xhtml:div");
  tr.append("xhtml:td").attr("class", "legend-label").text("You Keep:");
  tr.append("xhtml:td").attr("id", "legend-keep").attr("class", "legend-value");
  tr.append("xhtml:td").attr("id", "legend-keep-percent").attr("class", "legend-percent");
}

/**
 * Update the variable portion of the legend: the totals
 * @param {Object} data Chart data
 */
function renderLegend(data) {
  var values = data[data.length - 1];
  var loseTotal = values["Fund Fees"] + values["Advisor Fees"] + values["Lost Earnings"];
  var keepTotal = values.total - loseTotal;
  var losePercent = loseTotal / (loseTotal + keepTotal);
  var keepPercent = keepTotal / (loseTotal + keepTotal);
  // var grandTotal = data[data.length-1].total;

  geom.area.overlay.select('#legend-keep-percent').text(d3.format(".0%")(keepPercent));
  geom.area.overlay.select('#legend-lose-percent').text(d3.format(".0%")(losePercent));
  geom.area.overlay.select('#legend-keep').text(d3.format("$,.0f")(keepTotal));
  geom.area.overlay.select('#legend-lose').text(d3.format("$,.0f")(loseTotal));
}

/**
 * Render a stacked bar chart
 * @param data The chart data
 */
function renderBarStack(data) {
  if (!geom) {
    return;
  }
  var g = geom.bar.g;
  g.append("g")
      .selectAll("g")
      .data(d3.stack().keys(config.keys)(data))
      .enter().append("g")
      .attr("class", function (d, i) {
        return "grad-linear-" + i;
      })
      .selectAll("rect")
      .data(function (d) {
        d.forEach(function (element) {
          element.key = d.key;
        });
        return d;
      })
      .enter().append("rect")
      .attr("x", function (d) {
        return geom.bar.xScale(d.data.Year);
      })
      .attr("y", function (d) {
        return geom.bar.xScale(d[1]);
      })
      .attr("height", function (d) {
        return geom.bar.xScale(d[0]) - geom.bar.yScale(d[1]);
      })
      .attr("width", geom.bar.xScale.bandwidth())
      .append("title").text(function (d) {
    return d.key + ": " + d3.format("$,.0f")(d.data[d.key]);
  });
}

/**
 * Render a stacked bar chart
 */
function renderAreaStack() {
  if (!geom) {
    return;
  }
  var stack = d3.stack();

  var area = d3.area()
          .x(function (d, i) {
            return geom.area.xScale(d.data.Year/*i+1*/);
          })
          .y0(function (d) {
            return geom.area.yScale(d[0]);
          })
          .y1(function (d) {
            return geom.area.yScale(d[1]);
          });

  var line1 = d3.line()
          .x(function (d, i) {
            return geom.area.xScale(d.data.Year/*i+1*/);
          })
          .y(function (d) {
            return geom.area.yScale(d[1]);
          });

  switch (config.curve) {
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
    var pointDist = geom.width / (data.length - 1);
    while (pointDist * pointGap < minPointDist) {
      pointGap++;
    }
    var thinData = [];
    if (pointGap === 1) {
      // if all the points are included, just use the raw data
      thinData = data;
    } else {
      // copy the column defs
      thinData.columns = data.columns;
      // iterate through the data points, add only those that meet the minimum point distance
      for (var i = 0; i < data.length; i++) {
        if (i === 0 || i === data.length - 1) {
          thinData.push(data[i]);
        } else if (i % pointGap === 0 && (data.length - 1 - i) * pointDist >= minPointDist) {
          thinData.push(data[i]);
        }
      }
    }

    stack.keys(config.keys);

    // a 'layer' is one tier of the stack
    var layers = geom.area.g/*.select(".graph")*/.selectAll(".layer");
    var layer = layers.data(stack(thinData));

    layer.exit().remove();

    // draw the areas
    layer.enter().append("g")
        .attr("class", function (d, i) {
          return "layer area-" + i;
        })//;
        .append("path")
        .attr("class", function (d, i) {
          return "area area-" + i;
        })
        .attr("d", area);

    var path = layer.select("path");
    path.merge(path).transition().duration(2000)
        .attr("d", area);

    // draw the lines at the top of the areas, using the same curve
    var lines = geom.area.g.select(".graph").selectAll(".line")
        .data(stack(thinData));
    lines.enter().append("path")
        .attr("class", function (d, i) {
          return "line line" + i;
        })
        .attr("fill", "none")
        .merge(lines).transition().duration(2000)
        .attr("d", line1);
  });
}

/**
 * Append a <defs> section to the <svg> element containing
 * <linearGradient> definitions for each chart color.  Two
 * sets of gradients are created, normal and highlighted.
 */
function svgDefs() {
  if (!geom) {
    return;
  }
  var gradColors = [
    ["#338833", "#42bd41", "#88ff88"], // green
    ["#cc3200", "#ff4500", "#ff8800"], // red-1
    ["#992520", "#dd382f", "#ee6644"], // red-2
    ["#bb0000", "#ff0000", "#ff6666"]  // red-3
  ];
  var defs = geom.area.defs;

  // define linear gradients
  var linears = defs
          .selectAll("linearGradient")
          .data(gradColors)
          .enter();

  var colorGrads = linears.append("linearGradient")
          .attr("id", function (d, i) {
            return "gradLin" + i;
          })
          .attr("x1", "0%")
          .attr("y1", "100%")
          .attr("x2", "0%")
          .attr("y2", "0%");
  colorGrads.append("stop")
          .attr("class", "dark")
          .attr("offset", "0%")
          .attr("stop-color", function (d, i) {
            return config.colors[i][0];
          });
  colorGrads.append("stop")
          .attr("class", "color")
          .attr("offset", "25%")
          .attr("stop-color", function (d, i) {
            return gradColors[i][1];
          });

  var hiLiGrads = linears.append("linearGradient")
          .attr("id", function (d, i) {
            return "gradLinHL" + i;
          })
          .attr("x1", "0%")
          .attr("y1", "100%")
          .attr("x2", "0%")
          .attr("y2", "0%");
  hiLiGrads.append("stop")
          .attr("class", "dark")
          .attr("offset", "0%")
          .attr("stop-color", function (d) {
            return d[1];
          });
  hiLiGrads.append("stop")
          .attr("class", "color")
          .attr("offset", "25%")
          .attr("stop-color", function (d) {
            return d[2];
          });

  // define radial gradients
  defs = geom.pie.defs;

  var radials = defs
          .selectAll("radialGradient")
          .data(d3.pie()(config.pieColors), function (d, i) {
            return "grad" + i;
          })
          .enter();

  var colorGrads = radials.append("radialGradient")
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", "75%")
          .attr("id", function (d, i) {
            return "grad" + i;
          });
  colorGrads.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", function (d) {
            return d.data[1];
          });
  colorGrads.append("stop")
          .attr("offset", "85%")
          .attr("stop-color", function (d) {
            return d.data[0];
          });

  var hiLites = radials.append("radialGradient")
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", "75%")
          .attr("id", function (d, i) {
            return "gradHL" + i;
          });
  hiLites.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", function (d) {
            return d.data[2];
          });
  hiLites.append("stop")
          .attr("offset", "75%")
          .attr("stop-color", function (d) {
            return d.data[1];
          });
}
/**
 *
 */
function initPie() {
  if (!geom) {
    return;
  }

  var width = geom.width,
      height = geom.height;
  geom.pie.radius = Math.min(width, height) / 2 * .8;

  var centerX = width / 2,
          centerY = height / 2;
  geom.pie.g.attr("transform", "translate(" + centerX + "," + centerY + ")");

  geom.pie.colorScale = d3.scaleOrdinal()
      .domain(config.pieKeys)
      .range(config.pieColors);

  var g = geom.pie.g;
  g.append("g")
          .attr("class", "slices");
  g.append("g")
          .attr("class", "labels");
  g.append("g")
          .attr("class", "percents");
  g.append("g")
          .attr("class", "lines");
}

function updatePie() {
  if (!geom) {
    return;
  }

  fetchData(function (error, data) {
    var values = data[data.length - 1];
    var loseTotal = values["Fund Fees"] + values["Advisor Fees"] + values["Lost Earnings"];
    var keepTotal = values.total - loseTotal;

    var pieData = [
      {
        label: config.pieKeys[0],
        value: keepTotal,
        fmtValue: d3.format('$,.0f')(keepTotal),
        percent: d3.format('.0%')(keepTotal / values.total)
      },
      {
        label: config.pieKeys[1],
        value: loseTotal,
        fmtValue: d3.format('$,.0f')(loseTotal),
        percent: d3.format('.0%')(loseTotal / values.total)
      }
    ];

    var pie = d3.pie()
            .sort(null)
            .value(function (d) {
              return d.value;
            });

    var arc = d3.arc()
            .outerRadius(geom.pie.radius * 0.8)
            .innerRadius(0);

    var innerArc = d3.arc()
            .innerRadius(geom.pie.radius * 0.7)
            .outerRadius(geom.pie.radius * 0.7);

    var outerArc = d3.arc()
            .innerRadius(geom.pie.radius * 0.9)
            .outerRadius(geom.pie.radius * 0.9);

    var percentArc = d3.arc()
            .innerRadius(geom.pie.radius * 0.35)
            .outerRadius(geom.pie.radius * 0.35);


    var key = function (d) {
      return d.data.label;
    };

    var g = geom.pie.g;
    /* ------- PIE SLICES -------*/
    var slice = g.select(".slices").selectAll(".slice")
            .data(pie(pieData)/*, key*/);

    slice.exit()
            .remove();

    var slices = slice.enter()
            .append("path")
            .attr("class", function (d, i) {
              return "slice grad-radial-" + i;
            })
            .attr("fill", function (d, i) {
              return "url(#grad" + i + ")";
            });

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
    slices.append("title").text(function (d) {
      return "Total: " + d.data.fmtValue;
    });

    /* ------- TEXT LABELS -------*/

    function midAngle(d) {
      return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

    var text = g.select(".labels").selectAll("g")
            .data(pie(pieData), key);

    var textMerge = text.enter()
            .append("g")
            .merge(text);

    textMerge.selectAll("text").remove();
    textMerge.append("text")
            .attr("class", "pie-label")
            .text(function (d) {
              return d.data.label;
            });
    textMerge.append("text")
            .attr("class", "amount")
            .attr("y", "20")
            .text(function (d) {
              return d.data.fmtValue;
            });

    textMerge.transition().duration(1000)
            .attrTween("transform", function (d) {
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function (t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = geom.pie.radius * (midAngle(d2) < Math.PI ? 1 : -1);
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

    var percents = g.select(".percents").selectAll("g")
            .data(pie(pieData), key);

    var percentMerge = percents.enter()
            .append("g")
            .merge(percents);

    percentMerge.selectAll("text").remove();
    percentMerge.append("text")
            .attr("class", "percent")
            .text(function (d) {
              return d.data.percent;
            });

    percentMerge.transition().duration(1000)
            .attrTween("transform", function (d) {
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function (t) {
                var d2 = interpolate(t);
                var pos = percentArc.centroid(d2);
                // pos[0] = chartCtx.radius * (midAngle(d2) < Math.PI ? 1 : -1);
                // pos[1] -= 10; // adjust for multi-line text
                return "translate(" + pos + ")";
              };
            });

    percents.exit()
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
                pos[0] = geom.pie.radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                return [innerArc.centroid(d2), outerArc.centroid(d2), pos];
              };
            });

    polyline.exit()
            .remove();
  });
}

function initTable() {

  var div = geom.bar.overlay;
  var table = div.append("xhtml:table");
  var tr = table.append("xhtml:tr");
  tr.append("xhtml:td").text("Total Earnings");
  tr.append("xhtml:td").attr("id", "td-total-earnings").attr("class", "value");
  tr = table.append("xhtml:tr").attr("class", "keep");
  tr.append("xhtml:td").text("You Keep");
  tr.append("xhtml:td").attr("id", "td-you-keep").attr("class", "value");
  tr = table.append("xhtml:tr").attr("class", "lose");
  tr.append("xhtml:td").text("Fund Fees");
  tr.append("xhtml:td").attr("id", "td-fund-fees").attr("class", "value");
  tr = table.append("xhtml:tr").attr("class", "lose");
  tr.append("xhtml:td").text("Advisor Fees");
  tr.append("xhtml:td").attr("id", "td-advisor-fees").attr("class", "value");
  tr = table.append("xhtml:tr").attr("class", "lose");
  tr.append("xhtml:td").text("Lost Earnings");
  tr.append("xhtml:td").attr("id", "td-lost-earnings").attr("class", "value");
  tr = table.append("xhtml:tr").attr("class", "lose-total");
  tr.append("xhtml:td").text("Total Lost");
  tr.append("xhtml:td").attr("id", "td-total-lost").attr("class", "value");
}

function updateTable() {
  if (!geom) {
    return;
  }

  fetchData(function (error, data) {
    var values = data[data.length - 1];
    var loseTotal = values["Fund Fees"] + values["Advisor Fees"] + values["Lost Earnings"];
    var keepTotal = values.total - loseTotal;

    geom.bar.overlay.select('#td-total-earnings').text(d3.format('$,.0f')(values.total));
    geom.bar.overlay.select('#td-you-keep').text(d3.format('$,.0f')(keepTotal));
    geom.bar.overlay.select('#td-fund-fees').text(d3.format('$,.0f')(values["Fund Fees"]));
    geom.bar.overlay.select('#td-advisor-fees').text(d3.format('$,.0f')(values["Advisor Fees"]));
    geom.bar.overlay.select('#td-lost-earnings').text(d3.format('$,.0f')(values["Lost Earnings"]));
    geom.bar.overlay.select('#td-total-lost').text(d3.format('$,.0f')(loseTotal));
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
function maxSize(parent, /*aspectRatio, margin,*/ mustFit) {
  // if (!margin) {
  //     margin = {top: 10, right: 10, bottom: 10, left: 10};
  // }
  var parentW = parent.innerWidth(),
          parentH = parent.innerHeight(),
          w = parentW,
          h = parentH;
  var xOffsets = [0, 0, 0];
  var totalW = w;
  if (w >= config.minChartWidth * 3) {
    w = w / 3;
    xOffsets = [0, w, w * 2];
    config.showing = 'all';
  } else if (w > config.maxChartWidth) {
    w = config.maxChartWidth;
    totalW = w;
    if (config.showing === 'all') {
      config.showing = 'area';
    }
  }
  if (w / h < config.aspectRatio) {
    // the area is too too tall/narrow
    // if (mustFit) {
    h = w / config.aspectRatio;  // shrink the height
    // } else {
    //     w = config.aspectRatio * h;  // grow the width
    // }
  } else {
    // the area is too short/wide
    // if (mustFit) {
    //     w = h * config.aspectRatio;  // shrink the width
    // } else {
    h = w / config.aspectRatio;  // grow the height
    // }
  }
  return {
    w: w,
    h: h,
    parentW: parentW,
    parentH: parentH,
    chartW: w,
    chartH: h,
    xOffsets: xOffsets,
    totalW: totalW
  };
}


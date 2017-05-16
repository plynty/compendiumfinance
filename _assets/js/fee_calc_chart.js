/* global d3 */

'use strict';

// Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;

var config = {
  minChartWidth: 350,
  maxChartWidth: 500,
  aspectRatio: 1.5,
  margin: {top: 0, right: 15, bottom: 40, left: 12}, // margin for d3 area chart to draw axes
  curve: 'basis',

  keysKeepLose: ["You Keep", "You Lose"],
  keysLoseDetail: ["Lost Earnings", "Advisor Fees", "Fund Fees"],
  keysKeep: ["You Keep"],

  colors: [
//    "#3f3", // green
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

  showing: "doc"
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
  initBarStack();


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
    renderBarStack();
  });
}

function swipeChart(leftRight) {
  switch (config.showing) {
    case 'doc':
      config.showing = leftRight === 'right' ? 'bar' : 'area';
      break;
    case 'area':
      config.showing = leftRight === 'right' ? 'doc' : 'pie';
      break;
    case 'pie':
      config.showing = leftRight === 'right' ? 'area' : 'bar';
      break;
    case 'bar':
      config.showing = leftRight === 'right' ? 'pie' : 'doc';
      break;
  }
  showChart(config.showing);
}

function showChart(chartType) {
  config.showing = chartType;

  function fadeDiv(selection, opacity) {
    selection.transition().duration(1000)
            .style("opacity", opacity);
  }
  if (config.showing === 'doc') {
    $('#doc').show();
    $('div.charts').hide();
//    $('div.input-form').hide();
  } else {
    $('#doc').hide();
    $('div.charts').show();
//    $('div.input-form').show();
  }
  fadeDiv(d3.select('#doc'), (config.showing === 'doc') ? 1 : 0);
  fadeDiv(d3.select('div.charts'), (config.showing !== 'doc') ? 1 : 0);
  fadeDiv(d3.select('div.input-form'), (config.showing !== 'doc') ? 1 : 0);

  fadeDiv(geom.area.topDiv, (config.showing === 'area') ? 1 : 0);
  fadeDiv(geom.pie.topDiv, (config.showing === 'pie') ? 1 : 0);
  fadeDiv(geom.bar.topDiv, (config.showing === 'bar') ? 1 : 0);
  shadeButtons();
}

function shadeButtons() {
  $('.chart-btn-group .btn-group .btn').each(function () {
    if ($(this).hasClass('chart-' + config.showing)) {
      $(this).addClass('selected');
    } else {
      $(this).removeClass('selected');
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
  var size = maxSize($(chartDivSelector), true),
          width = size.chartW,
          height = size.chartH;

  var areaGeom = {},
      pieGeom = {},
      barGeom = {};
  var chartDiv = d3.select(chartDivSelector);

  // clear previous rendering
  if (isIE) {
    $(chartDivSelector).find('.chart, .chart-overlay').each(function() {
      for (var i = 0; i < this.childNodes.length; i++) {
        this.removeChild(this.childNodes[i]);
      }
    });
  } else {
    $(chartDivSelector).find('.chart > *, .chart-overlay > *').each(function() {
      this.remove();
    });
  }

  // construct area chart geom
  areaGeom.topDiv = chartDiv.select('.area-chart')
      .style("left", size.xOffsets[0]+'px')
      .style("opacity", (config.showing === 'all' || config.showing === 'area') ? 1 : 0);
  areaGeom.svg = areaGeom.topDiv.select('svg.chart')
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

  // construct pie chart geom
  pieGeom.topDiv = chartDiv.select('.pie-chart')
      .style("left", size.xOffsets[1]+'px')
      .style("opacity", (config.showing === 'all' || config.showing === 'pie') ? 1 : 0);
  pieGeom.svg = pieGeom.topDiv.select('svg.chart')
      .attr("viewBox", "0 0 " + width + " " + height);
  if (isIE) {
    pieGeom.svg.attr("height", height);
  }
  pieGeom.defs = pieGeom.svg.append("defs");
  pieGeom.g = pieGeom.svg.append("g")
      .attr("class", "pie-chart");
  pieGeom.overlay = pieGeom.topDiv.select('.chart-overlay');

  // construct bar chart geom
  barGeom.topDiv = chartDiv.select('.bar-chart')
      .style("left", size.xOffsets[2]+'px')
      .style("opacity", (config.showing === 'all' || config.showing === 'bar') ? 1 : 0);
  barGeom.svg = barGeom.topDiv.select('svg.chart')
      .attr("viewBox", "0 0 " + width + " " + height);
  barGeom.defs = barGeom.svg.append("defs");
  barGeom.g = barGeom.svg.append("g")
    .attr("class", "bar-chart");
  barGeom.overlay = barGeom.topDiv.select('.chart-overlay');
  if (isIE) {
    barGeom.svg.attr("height", height);
  }

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

  $('.chart-btn-group .btn-group, .input-form').css('width', size.totalW+'px');
  $('.h-separator').css('width', (size.totalW - 48)+'px');

  geom = {
    chartDiv: chartDiv,
    area: areaGeom,
    pie: pieGeom,
    bar: barGeom,
    width: width,
    height: height,
    wide3: size.wide3
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
          .attr("transform", "translate(" + (geom.width / 2) + ", " + (geom.height + 20) + ")")
          .append("text").text("Years");

}

/**
 * Render the vertical and horizontal axes
 * @param data The chart data (determines max limits of the axes)
 */
function renderAxes(data) {
  if (!geom) {
    return;
  }
  geom.area.xScale.domain([1, data.length]);

  geom.area.yScale.domain([0, d3.max(data, function (d) {
      return d["Total Earnings"];
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
        .tickValues([1,data.length])
      );
}

/**
 * Render the legend in the specified <g> element, with the
 * given x,y offset
 */
function initLegend() {
  if (!geom) {
    return;
  }
  var legendDiv = geom.area.overlay.select('.legend');

  var table = legendDiv.append("xhtml:table");

  var tr = table.append("xhtml:tr").attr("class", "title");
  tr.append("xhtml:th").attr("class", "legend-title").attr("colspan", "2").text("True Cost of Fees");

  tr = table.append("xhtml:tr").attr("class", "lose");
  tr.append("xhtml:td").attr("class", "legend-label").text("You Lose");
  tr.append("xhtml:td").attr("id", "legend-lose").attr("class", "legend-value");

  tr = table.append("xhtml:tr").attr("class", "keep");
  tr.append("xhtml:td").attr("class", "legend-label").text("You Keep");
  tr.append("xhtml:td").attr("id", "legend-keep").attr("class", "legend-value");
}

/**
 * Update the variable portion of the legend: the totals
 * @param {Object} data Chart data
 */
function renderLegend(data) {
  var legendDiv = geom.area.overlay.select('.legend');
  legendDiv.style('display', 'block');

  var lastYearValues = data[data.length - 1];
  var loseTotal = lastYearValues["You Lose"];
  var keepTotal = lastYearValues["You Keep"];

  legendDiv.select('#legend-keep').transition().duration(1500)
      .tween('legend-keep', function(d) {
        this._current = this._current || lastYearValues["You Keep"];
        var interpolate = d3.interpolateNumber(this._current, lastYearValues["You Keep"]);
        this._current = interpolate(1);
        var node = this;
        return function (t) {
          var d2 = interpolate(t);
          node.innerText = d3.format('$,.0f')(d2);
        };
      });

  legendDiv.select('#legend-lose').transition().duration(1500)
      .tween('legend-lose', function(d) {
        this._current = this._current || lastYearValues["You Lose"];
        var interpolate = d3.interpolateNumber(this._current, lastYearValues["You Lose"]);
        this._current = interpolate(1);
        var node = this;
        return function (t) {
          var d2 = interpolate(t);
          node.innerText = d3.format('$,.0f')(d2);
        };
      });

}


function initBarStack() {
    var g = geom.bar.g;
    g.append("g")
        .attr("class", "lose")
        .attr("transform", "translate("+((geom.width - 32)-50)+" 0)");
    g.append("g")
        .attr("class", "keep")
        .attr("transform", "translate("+((geom.width - 32)-102)+" 0)");
    var axes = g.append("g")
        .attr("class", "axes");
    var margin = 15;
//    var top = geom.height * .1 - margin;
    var bottom = geom.height - margin;
    var right = geom.width * .8;
    var left = geom.width * .2;
    axes.append("polyline")
        .attr("points", right+","+bottom+" "+left+","+bottom);
}

/**
 * Render a stacked bar chart
 */
function renderBarStack() {
  if (!geom) {
    return;
  }

  fetchData(function(error, data) {
    var g = geom.bar.g;
    var lastYear = [data[data.length - 1]];
    var yScale = d3.scaleLinear()
        .rangeRound([geom.height * .9, geom.height * .1])
        .domain([0, Math.max(lastYear[0]["You Keep"], lastYear[0]["You Lose"])]);
    var stackLose = d3.stack();
    stackLose.keys(config.keysLoseDetail);
    var rects = g.select("g.lose")
          .selectAll("rect");
    rects.data(stackLose(lastYear))
        .enter().append("rect")
        .attr("class", function(d, i) {
          return "rect-lose-"+i;
        })
        .attr("x", 0)
        .attr("width", 50)
        .merge(rects).transition().duration(2000)
        .attrTween("y", function (d) {
          return d3.interpolateNumber(this.getAttribute("y"), yScale(d[0][1]));
        })
        .attrTween("height", function (d) {
          return d3.interpolateNumber(this.getAttribute("height"), yScale(d[0][0]) - yScale(d[0][1]));
        });
    var stackKeep = d3.stack();
    stackKeep.keys(config.keysKeep);
    rects = g.select("g.keep")
          .selectAll("rect");
    rects.data(stackKeep(lastYear))
        .enter().append("rect")
        .attr("class", "rect-keep")
        .attr("x", 0)
        .attr("width", 50)
        .merge(rects).transition().duration(2000)
        .attrTween("y", function (d) {
          return d3.interpolateNumber(this.getAttribute("y"), yScale(d[0][1]));
        })
        .attrTween("height", function (d) {
          return d3.interpolateNumber(this.getAttribute("height"), yScale(d[0][0]) - yScale(d[0][1]));
        });
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

    stack.keys(config.keysKeepLose);

    // a 'layer' is one tier of the stack
    var layers = geom.area.g.selectAll(".layer");
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
    var lines = geom.area.g.select(".chart").selectAll(".line")
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
  geom.pie.g.attr("transform", "translate(" + centerX + "," + (centerY) + ")");

  geom.pie.colorScale = d3.scaleOrdinal()
      .domain(config.keysKeepLose)
      .range(config.pieColors);

  var g = geom.pie.g;
  g.append("text")
      .attr("class", "title")
      .attr("text-anchor", "middle")
      .attr("y", -5)
      .text("True Cost");
  g.append("text")
      .attr("class", "title")
      .attr("text-anchor", "middle")
      .attr("y", 20)
      .text("of Fees");
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
    var lastYearValues = data[data.length - 1];
    var loseTotal = lastYearValues["You Lose"];
    var keepTotal = lastYearValues["You Keep"];

    var pieData = [
      {
        label: config.keysKeepLose[0],
        value: keepTotal,
        percent: keepTotal / (keepTotal + loseTotal)
      },
      {
        label: config.keysKeepLose[1],
        value: loseTotal,
        percent: loseTotal / (keepTotal + loseTotal)
      }
    ];

    var pie = d3.pie()
            .sort(null)
            .value(function (d) {
              return d.value;
            });

    var arc = d3.arc()
            .outerRadius(geom.pie.radius * 0.8)
            .innerRadius(geom.pie.radius * 0.6);

    var innerArc = d3.arc()
            .innerRadius(geom.pie.radius * 0.7)
            .outerRadius(geom.pie.radius * 0.7);

    var outerArc = d3.arc()
            .innerRadius(geom.pie.radius * 0.9)
            .outerRadius(geom.pie.radius * 0.9);

    var key = function (d) {
      return d.data.label;
    };

    var g = geom.pie.g;
    /* ------- PIE SLICES -------*/
    var slicePaths = g.select(".slices").selectAll("path")
        .data(pie(pieData), key);

    slicePaths.exit()
        .remove();

    slicePaths.enter()
        .append("path")
        .attr("class", function (d, i) {
          return i === 0 ? "keep" : "lose";
        })
        .merge(slicePaths)
        .transition().duration(1500)
        .attrTween("d", function (d) {
          this._current = this._current || d;
          var interStart = d3.interpolate(this._current.startAngle, d.startAngle);
          var interEnd = d3.interpolate(this._current.endAngle, d.endAngle);
          this._current.startAngle = interStart(1);
          this._current.endAngle = interEnd(1);
          return function (t) {
            d.startAngle = interStart(t);
            d.endAngle = interEnd(t);
            return arc(d);
          };
        });

    /* ------- TEXT LABELS -------*/

    function midAngle(d) {
      return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

    var text = g.select(".labels").selectAll("g")
        .data(pie(pieData), key);

    var textEnter = text.enter()
        .append("g")
        .attr("class", function(d, i) {
          return i === 0 ? "keep" : "lose";
        });
    textEnter.append("text")
        .attr("class", "pie-label")
        .attr("y", 20)
        .text(function (d) {
          return d.data.label;
        });
    textEnter.append("text")
        .attr("class", "percent")
        .attr("y", 0);

    var textMerge = textEnter
        .merge(text);

    if (isIE) {
      textMerge.select('text.percent').text(function(d) {
        return d3.format('.0%')(d.data.percent);
      });
    } else {

      textMerge.transition().duration(1500)
          .select('text.percent')
          .tween('percent-label', function(d) {
            this._current = this._current || d.data.percent;
            var interpolate = d3.interpolateNumber(this._current, d.data.percent);
            this._current = interpolate(1);
            var node = this;
            return function (t) {
              var d2 = interpolate(t);
              node.innerHTML = d3.format('.0%')(d2);
            };
          });
    }

    textMerge.transition().duration(1500)
        .attrTween("transform", function (d) {
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(1);
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

    /* ------- SLICE TO TEXT POLYLINES -------*/

    var polyline = g.select(".lines").selectAll("polyline")
        .data(pie(pieData), key);

    polyline.enter()
        .append("polyline")
        .attr("class", function(d, i) {
          return i === 0 ? "keep" : "lose";
        })
        .merge(polyline)
        .transition().duration(1500)
        .attrTween("points", function (d) {
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(1);
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

  var tr = table.append("xhtml:tr").attr("class", "title");
  tr.append("xhtml:th").attr("class", "legend-title").attr("colspan", "2").text("True Cost of Fees");

  tr = table.append("xhtml:tr").attr("class", "fund-fees");
  tr.append("xhtml:th").text("Fund Fees");
  tr.append("xhtml:td").attr("id", "td-fund-fees").attr("class", "value");

  tr = table.append("xhtml:tr").attr("class", "advisor-fees");
  tr.append("xhtml:th").text("Advisor Fees");
  tr.append("xhtml:td").attr("id", "td-advisor-fees").attr("class", "value");

  tr = table.append("xhtml:tr").attr("class", "lost-earnings");
  tr.append("xhtml:th").text("Lost Earnings");
  tr.append("xhtml:td").attr("id", "td-lost-earnings").attr("class", "value");

  tr = table.append("xhtml:tr").attr("class", "keep");
  tr.append("xhtml:th").text("You Keep");
  tr.append("xhtml:td").attr("id", "td-you-keep").attr("class", "value");
}

function updateTable() {
  if (!geom) {
    return;
  }

  fetchData(function (error, data) {
    var lastYearValues = data[data.length - 1];

    geom.bar.overlay.select('#td-you-keep').transition().duration(1500)
        .tween('you-keep', function(d) {
          this._current = this._current || lastYearValues["You Keep"];
          var interpolate = d3.interpolateNumber(this._current, lastYearValues["You Keep"]);
          this._current = interpolate(1);
          var node = this;
          return function (t) {
            var d2 = interpolate(t);
            node.innerText = d3.format('$,.0f')(d2);
          };
        });

    geom.bar.overlay.select('#td-fund-fees').transition().duration(1500)
        .tween('you-keep', function(d) {
          this._current = this._current || lastYearValues["Fund Fees"];
          var interpolate = d3.interpolateNumber(this._current, lastYearValues["Fund Fees"]);
          this._current = interpolate(1);
          var node = this;
          return function (t) {
            var d2 = interpolate(t);
            node.innerText = d3.format('$,.0f')(d2);
          };
        });

    geom.bar.overlay.select('#td-advisor-fees').transition().duration(1500)
        .tween('you-keep', function(d) {
          this._current = this._current || lastYearValues["Advisor Fees"];
          var interpolate = d3.interpolateNumber(this._current, lastYearValues["Advisor Fees"]);
          this._current = interpolate(1);
          var node = this;
          return function (t) {
            var d2 = interpolate(t);
            node.innerText = d3.format('$,.0f')(d2);
          };
        });

    geom.bar.overlay.select('#td-lost-earnings').transition().duration(1500)
        .tween('you-keep', function(d) {
          this._current = this._current || lastYearValues["Lost Earnings"];
          var interpolate = d3.interpolateNumber(this._current, lastYearValues["Lost Earnings"]);
          this._current = interpolate(1);
          var node = this;
          return function (t) {
            var d2 = interpolate(t);
            node.innerText = d3.format('$,.0f')(d2);
          };
        });
  });
}

/**
 * Based on the size of the parent element, determine the maximum size
 * that can can contain a rect of with the desired aspect ratio.
 * @param element
 * @return Object containing multiple sizes:
 * w,h: total svg drawing size, including axes
 * chartW,chartH: area where the main chart resides, without axes
 * parentW,parentH: total inner area of the parent container.
 *
 */
function maxSize(element) {
  var parent = element.parent();
  var parentW = parent.innerWidth(),
          parentH = parent.innerHeight(),
          w = parentW,
          h = parentH;
  var xOffsets = [0, 0, 0];
  var totalW = w;
  var wide3 = false;

  if (w > config.maxChartWidth) {
    w = config.maxChartWidth;
    totalW = w;
    if (config.showing === 'all') {
      config.showing = 'area';
    }
  }
  if (w / h < config.aspectRatio) {
    // the area is too too tall/narrow
    h = w / config.aspectRatio;  // shrink the height
  } else {
    // the area is too short/wide
    h = w / config.aspectRatio;  // grow the height
  }
  return {
    w: w,
    h: h,
    parentW: parentW,
    parentH: parentH,
    chartW: w,
    chartH: h,
    xOffsets: xOffsets,
    totalW: totalW,
    wide3: wide3
  };
}


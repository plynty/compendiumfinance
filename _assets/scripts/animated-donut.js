//plynty-donut Chart


  var DONUT_INITIALIZED = false;
  var DURATION = 1000;
  var INTERVAL_DURATION = 9000;

  var incomeColor = '#3ebeb0';
  var expensesColor = '#134e75';
  var darkGrayTextColor = '#606060';

  var colorScale = d3.scale.ordinal()
    .domain(['income', 'expenses'])
    .range([incomeColor, expensesColor]);

  var animatedData = getData();

  // Donut Variables
  var donutIndex = 0;
  var donutWidth = 700;
  var donutHeight = 450;
  var radius = Math.min(donutWidth, donutHeight) / 2;
  var LABEL_X_POS = radius * 1.24;
  var donut, pie, startAngle, endAngle, arc, outerArc, key;
  setDonutVars();

  // ***********************************************************
  // *** Animation control for D3 Chart and text ***************
  // ***********************************************************

  animateAll();
  var runAnimation = setInterval(animateAll, INTERVAL_DURATION);

  function animateAll() {
    animateTagLineText();
    animateTagIcon();
    animateMobileTagLineText();
    animateExplanationText();
    changeAndMorph(animatedData[donutIndex].donutData);
    if (donutIndex === (animatedData.length - 1)) {
      donutIndex = 0;
    } else {
      donutIndex = donutIndex + 1;
    }
  }

  // ***********************************************************
  // *** Functions To Set Pie and calc midAngle for D3 Chart ***
  // ***********************************************************

  function changeAndMorph(_data_) {
    setPie();

    sliceTransition(_data_);
    textLabelTransition(_data_);
    polylineTransition(_data_);
    centerTextTransition();
  }

  function midAngle(d) {
    return (d.startAngle + (d.endAngle - d.startAngle) / 2);
  }

  // ******************************************************
  // *** Functions to set and transition donut chart ******
  // ******************************************************

  function setDonutVars() {
    donut = d3.select('#animated-plynty-donut')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0,0,' + donutWidth + ',' + donutHeight)
      .append('g');

    donut.append('g')
      .attr('class', 'slices');
    donut.append('g')
      .attr('class', 'labels');
    donut.append('g')
      .attr('class', 'values');
    donut.append('g')
      .attr('class', 'lines');
    donut.append('g')
      .attr('class', 'center-text');

    donut.select('g.center-text')
      .append('text')
      .attr('class', 'center-line1')
      .attr('text-anchor', 'middle');

    arc = d3.svg.arc()
      .outerRadius(radius * 0.70)
      .innerRadius(radius * 0.60);

    outerArc = d3.svg.arc()
      .innerRadius(radius * 0.80)
      .outerRadius(radius * 0.80);

    donut.attr('transform', 'translate(' + donutWidth / 2 + ',' + donutHeight / 2 + ')');

    key = function(d) {
      return d.data.label;
    };
  }

  function setPie() {
    startAngle = (3 * (Math.PI / 2));
    endAngle = (7 * (Math.PI / 2));

    pie = d3.layout.pie()
      .sort(null)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .padAngle(.03)
      .value(function(d) {
        return d.value;
      });
  }

  function sliceTransition(_data_) {
    var slice = donut.select('.slices').selectAll('path.slice')
      .data(pie(_data_), key);

    slice.enter()
      .insert('path')
      .style('fill', function(d) {
        return colorScale(d.data.label);
      })
      .attr('class', function(d) {
        return 'slice ' + 'slice-' + d.data.label
      });

    if (DONUT_INITIALIZED) {
      slice.transition()
        .duration(DURATION)
        .attrTween('d', function(d) {
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function(t) {
            return arc(interpolate(t));
          };
        });
    } else {
      slice.transition()
        .delay(function(d, i) {
          return i * DURATION;
        })
        .duration(DURATION)
        .attrTween('d', function(d) {
          var i = d3.interpolate(d.startAngle, d.endAngle);
          return function(t) {
            d.endAngle = i(t);
            return arc(d);
          }
        });
    }

    slice.exit().remove();
  }

  function textLabelTransition(_data_) {
    var text = donut.select('.labels').selectAll('text')
      .data(pie(_data_), key);

    text.enter()
      .append('text')
      .attr('class', function(d) {
        return 'text-label ' + 'label-' + d.data.label
      })
      .attr('dy', '-0.35em')
      .style('opacity', function(d) {
        return DONUT_INITIALIZED ? 1 : 0;
      })
      .style('fill', function(d) {
        return colorScale(d.data.label);
      })
      .style('font-size', '1.5em')
      .text(function(d) {
        return d.data.label;
      });

    text.transition()
      .delay(function(d, i) {
        return DONUT_INITIALIZED ? 0 : i * 1100;
      })
      .duration(DURATION)
      .attrTween('transform', function(d, i) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          donut.select('.text-label.label-' + d.data.label)
            .text(function() {
              return d.data.label;
            });
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          if (d.data.label === 'income') {
            pos[0] = (LABEL_X_POS) * (midAngle(d2) > ((Math.PI + 0.001) * 2) ? 1 : -1);
          } else if (d.data.label === 'expenses') {
            pos[0] = (LABEL_X_POS) * (midAngle(d2) < ((Math.PI + 0.001) * 3) ? 1 : -1);
          }

          return 'translate(' + pos + ')';
        };
      })
      .styleTween('text-anchor', function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          if (d.data.label === 'income') {
            return midAngle(d2) > ((Math.PI + 0.001) * 2) ? 'end' : 'start';
          } else if (d.data.label === 'expenses') {
            return midAngle(d2) < ((Math.PI + 0.001) * 3) ? 'end' : 'start';
          }
        };
      })
      .style('opacity', 1);

    text.exit().remove();
  }

  function polylineTransition(_data_) {
    var transitions = 0;

    var polyline = donut.select('.lines').selectAll('polyline')
      .data(pie(_data_), key);

    polyline.enter()
      .append('polyline')
      .attr('class', function(d) {
        return 'polyline ' + 'polyline-' + d.data.label
      })
      .style('stroke', function(d) {
        return colorScale(d.data.label);
      })
      .style('opacity', function(d) {
        return DONUT_INITIALIZED ? 0.9 : 0;
      })
      .style('stroke-width', '2px')
      .style('fill', 'none');

    polyline.transition()
      .each(function() {
        ++transitions;
      })
      .delay(function(d, i) {
        return DONUT_INITIALIZED ? 0 : i * 1100;
      })
      .duration(DURATION)
      .attrTween('points', function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          if (d.data.label === 'income') {
            pos[0] = (LABEL_X_POS) * (midAngle(d2) > ((Math.PI + 0.001) * 2) ? 1 : -1);
          } else if (d.data.label === 'expenses') {
            pos[0] = (LABEL_X_POS) * (midAngle(d2) < ((Math.PI + 0.001) * 3) ? 1 : -1);
          }
          var inner = [arc.centroid(d2)[0], arc.centroid(d2)[1]];
          return [inner, outerArc.centroid(d2), pos];
        };
      })
      .style('opacity', 0.9)
      .each('end', function() {
        if (DONUT_INITIALIZED === false && --transitions === 0) {
          DONUT_INITIALIZED = true;
          sliceTransition(_data_, 0);
        }
      });

    polyline.exit().remove();
  }

  function centerTextTransition() {
    var centerTextLine1 = donut.select('text.center-line1');

    centerTextLine1.attr('dy', '0.25em')
      .attr('font-size', '2.50em')
      .style('fill', darkGrayTextColor)
      .style('opacity', function() {
        return DONUT_INITIALIZED ? 1 : 0;
      })
      .text(function() {
        return 'cashflow'
      });

    centerTextLine1.transition()
      .duration(function() {
        return DONUT_INITIALIZED ? 0 : 1500;
      })
      .style('opacity', 1);
  }

  // ******************************************************************
  // *** Functions to set and transition left side tag line text ******
  // ******************************************************************

  function animateTagLineText() {
    var textToAnimate = d3.select('#tagline-step-' + donutIndex);

    textToAnimate.transition()
      .duration(DURATION)
      .style('opacity', 1)
      .style('color', incomeColor)

    textToAnimate.transition()
      .delay(INTERVAL_DURATION)
      .duration(DURATION)
      .style('opacity', 0.87)
      .style('color', '#217269');
  }

  function animateTagIcon() {
    var iconToAnimate = d3.select('#tagicon-' + donutIndex);

    iconToAnimate.transition()
      .duration(DURATION)
      .style('opacity', 1)

    iconToAnimate.transition()
      .delay(INTERVAL_DURATION)
      .duration(DURATION)
      .style('opacity', 0);

  }

  // ***************************************************************
  // *** Functions to set and transition mobile tag line text ******
  // ***************************************************************

  function animateMobileTagLineText() {
    var mobileTextToAnimate = d3.select('#tagline-mobile-step-' + donutIndex);

    mobileTextToAnimate.transition()
      .duration(DURATION)
      .style('display', 'block')
      .style('opacity', 1)
      .style('color', incomeColor);

    mobileTextToAnimate.transition()
      .delay(INTERVAL_DURATION - DURATION)
      .duration(DURATION)
      .style('opacity', 0)
      .transition()
      .style('display', 'none');
  }

  // ******************************************************************
  // *** Functions to set and transition bottom explanation text ******
  // ******************************************************************


  function animateExplanationText() {
    var explanationTextAnimate = d3.select('#explanation-step-' + donutIndex);

    explanationTextAnimate.transition()
      .duration(DURATION)
      .style('display', 'block')
      .style('opacity', 1);

    explanationTextAnimate.transition()
      .delay(INTERVAL_DURATION - DURATION)
      .duration(DURATION)
      .style('opacity', 0)
      .transition()
      .style('display', 'none');
  }

  // **************************************************************
  // *** Function for getting chart data and text to display ******
  // **************************************************************

  function getData() {
    return [{
      step: 0,
      donutData: [{
        label: 'income',
        value: 50
      }, {
        label: 'expenses',
        value: 50
      }],
      tagLine: 'how much will you need?',
      explanation: 'A simple household budget --\nthe balance of what you earn and spend.\nThat\'s how plynty helps you plan for retirement.',
      donutType: 'balanced'
    }, {
      step: 1,
      donutData: [{
        label: 'income',
        value: 25
      }, {
        label: 'expenses',
        value: 75
      }],
      tagLine: 'when will you retire?',
      explanation: 'What if you retire early?\nHow will it change the lifestyle you want to live?\nplynty makes smart choices simple.',
      donutType: 'income only 1/4'
    }, {
      step: 2,
      donutData: [{
        label: 'income',
        value: 40
      }, {
        label: 'expenses',
        value: 60
      }],
      tagLine: 'smarter saving for a better life',
      explanation: 'A saving and investing strategy that minimizes fees.\nHow much more could you have?\nplynty helps you keep more.',
      donutType: 'income only 1/3'
    }, {
      step: 3,
      donutData: [{
        label: 'income',
        value: 50
      }, {
        label: 'expenses',
        value: 50
      }],
      tagLine: 'what if?',
      explanation: 'Which spending changes in get you closest to your lifestyle goal?\nAnswering that question is the power of plynty.',
      donutType: 'balanced'
    }, {
      step: 4,
      donutData: [{
        label: 'income',
        value: 70
      }, {
        label: 'expenses',
        value: 30
      }],
      tagLine: 'what will you do?',
      explanation: 'Work part-time, if only for the fun of it.\nWhether working for pay or volunteering for charity,\nStaying active is the key to lifelong happiness.',
      donutType: 'income 2/3'
    }, {
      step: 5,
      donutData: [{
        label: 'income',
        value: 50
      }, {
        label: 'expenses',
        value: 50
      }],
      tagLine: 'how will you spend your retirement?',
      explanation: 'Enjoying family, travel, hobbies?\nPlynty helps you fund your dreams',
      donutType: 'balanced'
    }];
  }

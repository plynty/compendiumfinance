var inputs = {
    rateOfReturn: .08,
    rateFundFee: .01,
    rateAdvisorFee: .0125,
    initial: 50000,
    period: 30
};


function validate() {
    calculate();
}

function calculate() {
    var initialStr = $("#investment-amount").val().replace(/[$,]/g, '');
    inputs.initial = parseInt(initialStr);
    inputs.period = parseInt($("#investment-period").val());
    // inputs.rateOfReturn = parseFloat(8) / 100;
    // inputs.rateFundFee = parseFloat($("#mutual-fund-fees").val()) / 100;
    // inputs.rateAdvisorFee = parseFloat($("#advisor-fee").val()) / 100;

    updateStack("#chart");
    updatePie("#chart")
}

/**
 * Simple callback that just returns the internal data
 */
function fetchData(callback) {
    var sp = new SavingsProjector(
        inputs.initial,
        inputs.period,
        inputs.rateOfReturn,
        inputs.rateFundFee,
        inputs.rateAdvisorFee
    );
    sp.calculate();
    var data = [];
    sp.yearTotals.forEach(function(item) {
        var year = {
            "Year": item.year,
            "You Keep": item.keptEarnings,
            "Fund Fees": item.totalFundFees,
            "Advisor Fees": item.totalAdvisorFees,
            "Lost Earnings": item.totalLostEarnings,
            "Total Earnings": item.totalEarnings,
            total: item.keptEarnings + item.totalFundFees + item.totalAdvisorFees + item.totalLostEarnings
        }
        data.push(year);
    });
    data.lostEarnings = sp.lostEarnings;
    data.totalLostEarnings = sp.totalLost;
    // var data = [
    //     {"Year": 1, "You Keep":initial, "Fund Fees":initial*rateFundFee, "Advisor Fees":initial*rateAdvisorFee, "Lost Earnings":250}
    // ];
    // data[0].total = data[0]["You Keep"] + data[0]["Fund Fees"] + data[0]["Advisor Fees"] + data[0]["Lost Earnings"];

    // for (var i = 1; i < period; i++) {
    //     var row = {
    //         "Year": i+1,
    //         "You Keep": data[i-1]["You Keep"] * (1 + rateOfReturn - rateFundFee - rateAdvisorFee),
    //         "Fund Fees": data[i-1]["Fund Fees"] + data[i-1]["You Keep"] * rateFundFee,
    //         "Advisor Fees": data[i-1]["Advisor Fees"] + data[i-1]["You Keep"] * rateAdvisorFee,
    //         "Lost Earnings": (data[i-1]["Fund Fees"] + data[i-1]["You Keep"] * rateFundFee)
    //                 + (data[i-1]["Advisor Fees"] + data[i-1]["You Keep"] * rateAdvisorFee)
    //     };
    //     row.total = row["You Keep"] + row["Fund Fees"] + row["Advisor Fees"] + row["Lost Earnings"];
    //     data.push(row);
    // }
    // data.columns = ["Year"].concat(config.keys);

    callback(null, data);
}

// detect size changes
var timer;
var size = {x: 0, y:0};
function resizeChart(selector) {
    console.log("Body resized");
    if (timer) {
        clearTimeout(timer);
    }
    var element = $(selector);
    if (size.x != element.width() || size.y != element.height()) {
        console.log("new size: " + element.width() + ", "+ element.height());
        size.x = element.width();
        size.y = element.height();
        timer = setTimeout(function(event) {
            console.log("Chart resized");
            generateCharts("#chart", "areaStack", "basis");
        }, 300);
    }
    return true;
};

var rateOfReturnSlider = document.getElementById('rate-of-return');
noUiSlider.create(rateOfReturnSlider, {
    start: [ 8.0 ],
    connect: 'lower',
    tooltips: false,
    format: wNumb({ decimals: 1 }) ,
    range: {
        'min': [  1.0 ],
        'max': [ 12.0 ]
    },
    step: 0.5,
    pips: { // Show a scale with the slider
        mode: 'steps',
        density: 24
    }
});

var mutualFundFeesSlider = document.getElementById('mutual-fund-fees');
noUiSlider.create(mutualFundFeesSlider, {
    start: [ 1.25 ],
    connect: 'lower',
    tooltips: false,
    format: wNumb({ decimals: 2 }) ,
    range: {
        'min': [  0 ],
        'max': [ 2.0 ]
    },
    step: 0.25,
    pips: { // Show a scale with the slider
        mode: 'steps',
        density: 8
    }
});

var advisorFeeSlider = document.getElementById('advisor-fee');
noUiSlider.create(advisorFeeSlider, {
    start: [ 1.00 ],
    connect: 'lower',
    tooltips: false,
    format: wNumb({ decimals: 2 }) ,
    range: {
        'min': [  0 ],
        'max': [ 1.5 ]
    },
    step: 0.25,
    pips: { // Show a scale with the slider
        mode: 'steps',
        density: 8
    }
});
function initSliderEvents() {
    rateOfReturnSlider.noUiSlider.on('update', function(labels, handle, values) {
        $('label[for="rate-of-return"]').html('Rate of Return (<span class="slider-value">'+labels[handle]+'%</span>)');
        inputs.rateOfReturn = values[handle] / 100.0;
        calculate();
    });

    mutualFundFeesSlider.noUiSlider.on('update', function(labels, handle, values) {
        $('label[for="mutual-fund-fees"]').html('Mutual Fund Fees (<span class="slider-value">'+labels[handle]+'%</span>)');
        inputs.rateFundFee = values[handle] / 100.0;
        calculate();
    });
    advisorFeeSlider.noUiSlider.on('update', function(labels, handle, values) {
        $('label[for="advisor-fee"]').html('Advisor Fee (<span class="slider-value">'+labels[handle]+'%</span>)');
        inputs.rateAdvisorFee = values[handle] / 100.0;
        calculate();
    });
}

function padBodyTop() {
    $('body').css('padding-top', $('#header').height() + 5);
}

padBodyTop();


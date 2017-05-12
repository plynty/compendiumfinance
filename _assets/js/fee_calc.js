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

var calculateTimer;
function calculate() {
    var initialStr = $("#investment-amount").val().replace(/[$,]/g, '');
    inputs.initial = parseInt(initialStr);
    inputs.period = parseInt($("#investment-period").val());

    clearTimeout(calculateTimer);
    calculateTimer = setTimeout(function() {
        updateStack("#chart");
        updatePie("#chart");
        updateTable("#chart");
    }, 750);
}

/**
 * Calculate chart data from user inputs
 * @param {function} callback Returns the results
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
            "Lost Earnings": item.totalLostEarnings - item.totalFundFees - item.totalAdvisorFees,
            "Total Lost Earnings": item.totalLostEarnings,
            "Total Earnings": item.totalEarnings,
            "You Lose": item.totalEarnings - item.keptEarnings,
//            total: item.keptEarnings + item.totalFundFees + item.totalAdvisorFees + item.totalLostEarnings
        };
        data.push(year);
    });
    data.lostEarnings = sp.lostEarnings;
    data.totalLostEarnings = sp.totalLost;

    callback(null, data);
}

// detect size changes
var timer;
var size = {x: 0, y:0};
function resizeChart(selector) {
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(function(event) {
        var element = $(selector).parent();
        if (size.x !== element.width() || size.y !== element.height()) {
            size.x = element.width();
            size.y = element.height();
            console.log(size.x+','+size.y);
            generateCharts(selector);
        }
    }, 300);
    return true;
};

var rateOfReturnSlider = document.getElementById('rate-of-return');
noUiSlider.create(rateOfReturnSlider, {
    start: [ 8.0 ],
    connect: 'lower',
    tooltips: false,
    format: wNumb({ decimals: 1 }) ,
    range: {
        'min': [  0.0 ],
        'max': [ 12.0 ]
    },
    step: 0.5
});

var mutualFundFeesSlider = document.getElementById('mutual-fund-fees');
noUiSlider.create(mutualFundFeesSlider, {
    start: [ 1.25 ],
    connect: 'lower',
    tooltips: false,
    format: wNumb({ decimals: 1 }) ,
    range: {
        'min': [  0 ],
        'max': [ 3.0 ]
    },
    step: 0.1
});

var advisorFeeSlider = document.getElementById('advisor-fee');
noUiSlider.create(advisorFeeSlider, {
    start: [ 1.00 ],
    connect: 'lower',
    tooltips: false,
    format: wNumb({ decimals: 1 }) ,
    range: {
        'min': [  0 ],
        'max': [ 3.0 ]
    },
    step: 0.1
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


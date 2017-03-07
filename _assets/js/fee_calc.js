var rateOfReturn = .08,
    rateFundFee = .01,
    rateAdvisorFee = .0125,
    initial = 50000
    period = 30;


function validate() {
    calculate();
}

function calculate() {
    var initialStr = $("#investment-amount").val().replace(/[$,]/g, '');
    initial = parseInt(initialStr);
    console.log(initial);
    period = parseInt($("#investment-period").val());
    console.log(period);
    rateOfReturn = parseFloat($("#rate-of-return").val()) / 100;
    console.log(rateOfReturn);
    rateFundFee = parseFloat($("#mutual-fund-fees").val()) / 100;
    console.log(rateFundFee);
    rateAdvisorFee = parseFloat($("#advisor-fee").val()) / 100;
    console.log(rateAdvisorFee);

    updateStack("#stack-chart");
    updateStack("#stack-chart2");
    updateStack("#stack-chart3");
    updateStack("#stack-chart4");
    updateStack("#stack-chart5");
}

/**
 * Simple callback that just returns the internal data
 */
function fetchData(callback) {
    var data = [
        {"Year": 1, "You Keep":initial, "Fund Fees":initial*rateFundFee, "Advisor Fees":initial*rateAdvisorFee, "Lost Earnings":250}
    ];
    data[0].total = data[0]["You Keep"] + data[0]["Fund Fees"] + data[0]["Advisor Fees"] + data[0]["Lost Earnings"];

    for (var i = 1; i < period; i++) {
        var row = {
            "Year": i+1,
            "You Keep": data[i-1]["You Keep"] * (1 + rateOfReturn - rateFundFee - rateAdvisorFee),
            "Fund Fees": data[i-1]["Fund Fees"] + data[i-1]["You Keep"] * rateFundFee,
            "Advisor Fees": data[i-1]["Advisor Fees"] + data[i-1]["You Keep"] * rateAdvisorFee,
            "Lost Earnings": (data[i-1]["Fund Fees"] + data[i-1]["You Keep"] * rateFundFee)
                    + (data[i-1]["Advisor Fees"] + data[i-1]["You Keep"] * rateAdvisorFee)
        };
        row.total = row["You Keep"] + row["Fund Fees"] + row["Advisor Fees"] + row["Lost Earnings"];
        data.push(row);
    }
    data.columns = ["Year"].concat(keys);

    callback(null, data);
}

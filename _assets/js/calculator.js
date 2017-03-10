"use strict";
var SavingsProjector = (function () {
    function SavingsProjector(initialInvestment, numYears, rate, fundFee, advisorFee) {
        this.initialInvestment = initialInvestment;
        this.numYears = numYears;
        this.rate = rate;
        this.fundFee = fundFee;
        this.advisorFee = advisorFee;
        this.totalEarnings = 0;
        this.keptEarnings = 0;
        this.totalFundFees = 0;
        this.totalAdvisorFees = 0;
        this.totalLostEarnings = 0;
        this.totalsByYear = [];
    }
    SavingsProjector.prototype.calculate = function () {
        this.totalEarnings = Number(this.initialInvestment);
        this.keptEarnings = Number(this.initialInvestment);
        for (var year = 1; year <= this.numYears; year++) {
            this.totalEarnings += this.totalEarnings * this.rate;
            var annualFundPayment = this.keptEarnings * this.fundFee;
            var annualAdvisorPayment = this.keptEarnings * this.advisorFee;
            this.keptEarnings += this.keptEarnings * this.rate;
            this.totalFundFees += annualFundPayment;
            this.totalAdvisorFees += annualAdvisorPayment;
            this.keptEarnings -= (annualFundPayment + annualAdvisorPayment);
            var thisYear = {
                year: year,
                totalEarnings: this.totalEarnings,
                keptEarnings: this.keptEarnings,
                totalFundFees: this.totalFundFees,
                totalAdvisorFees: this.totalAdvisorFees,
                totalLostEarnings: this.totalLost
            };
            this.totalsByYear.push(thisYear);
        }
    };
    Object.defineProperty(SavingsProjector.prototype, "lostEarnings", {
        get: function () {
            return this.totalEarnings - (this.totalFundFees + this.totalAdvisorFees + this.keptEarnings);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SavingsProjector.prototype, "totalLost", {
        get: function () {
            return this.totalEarnings - this.keptEarnings;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SavingsProjector.prototype, "yearTotals", {
        get: function () {
            return this.totalsByYear;
        },
        enumerable: true,
        configurable: true
    });
    return SavingsProjector;
}());
//# sourceMappingURL=calculator.js.map
import assert from "node:assert/strict";
import test from "node:test";
import {
  CALCULATOR_AMOUNT_CONFIG,
  CALCULATOR_PLANS,
  calculateMonthlyPayment,
  calculatePlanValues,
  formatAmount,
  getAmountProgress,
  getInitialCalculatorState,
} from "../src/lib/calculator.ts";

test("calculateMonthlyPayment handles zero rate as equal principal payments", () => {
  assert.equal(calculateMonthlyPayment(1_200_000, 0, 12), 100_000);
});

test("calculatePlanValues never applies a negative annual rate", () => {
  const result = calculatePlanValues(1_000_000, 30, {
    paymentPeriods: 5,
    firstPeriodRate: 2,
  });

  assert.equal(result.monthlyPayment, 200_000);
  assert.equal(result.overpayment, 20_000);
  assert.equal(result.overpaymentRate, 2);
});

test("getAmountProgress returns a CSS percentage in the configured range", () => {
  assert.equal(
    getAmountProgress(
      CALCULATOR_AMOUNT_CONFIG.min,
      CALCULATOR_AMOUNT_CONFIG.min,
      CALCULATOR_AMOUNT_CONFIG.max,
    ),
    "0%",
  );
  assert.equal(
    getAmountProgress(
      CALCULATOR_AMOUNT_CONFIG.max,
      CALCULATOR_AMOUNT_CONFIG.min,
      CALCULATOR_AMOUNT_CONFIG.max,
    ),
    "100%",
  );
});

test("initial calculator state stays aligned with configured plans", () => {
  const state = getInitialCalculatorState();

  assert.equal(state.planValues.length, CALCULATOR_PLANS.length);
  assert.equal(
    state.amountDisplayValue.replace(/\D/g, ""),
    String(CALCULATOR_AMOUNT_CONFIG.initialValue),
  );
  assert.equal(
    formatAmount(CALCULATOR_AMOUNT_CONFIG.max).replace(/\D/g, ""),
    String(CALCULATOR_AMOUNT_CONFIG.max),
  );
});

// Базовая годовая ставка для всех тарифов до применения скидок по акциям.
export const BASE_ANNUAL_RATE = 20;

export type PlanCalculationConfig = {
	paymentPeriods: number;
	firstPeriodRate: number;
};

export type CalculatorPlan = PlanCalculationConfig & {
	months: string;
	featured: boolean;
	profitable: boolean;
};

export type CalculatorPlanValues = {
	monthlyPayment: number;
	overpayment: number;
	overpaymentRate: number;
};

export type CalculatorInitialState = {
	amountDisplayValue: string;
	amountProgress: string;
	planValues: CalculatorPlanValues[];
};

export type CalculatorAmountConfig = {
	initialValue: number;
	min: number;
	max: number;
	step: number;
	maxDigits: number;
};

export type CalculatorPerk = {
	label: string;
};

// Границы и шаг для поля/слайдера суммы кредита.
export const CALCULATOR_AMOUNT_CONFIG: Readonly<CalculatorAmountConfig> = {
	initialValue: 75000000,
	min: 1000000,
	max: 150000000,
	step: 1000000,
	maxDigits: String(150000000).length,
};

// Список акций. Каждая выбранная акция уменьшает ставку на 1 п.п.
export const CALCULATOR_PERKS: readonly CalculatorPerk[] = [
	{ label: 'Приведи друга' },
	{ label: 'Добросовестный заемщик' },
	{ label: 'Взрывной рост' },
];

// Тарифы калькулятора: подписи карточек и параметры расчета для каждого срока.
// Если меняются сроки или параметры из Excel, править нужно в первую очередь здесь.
export const CALCULATOR_PLANS: readonly CalculatorPlan[] = [
	{ months: '3 месяца', featured: false, profitable: false, paymentPeriods: 3, firstPeriodRate: 1.5 },
	{ months: '6 месяцев', featured: true, profitable: false, paymentPeriods: 5, firstPeriodRate: 2 },
	{ months: '9 месяцев', featured: false, profitable: false, paymentPeriods: 8, firstPeriodRate: 3.75 },
	{ months: '12 месяцев', featured: false, profitable: false, paymentPeriods: 11, firstPeriodRate: 4.5 },
	{ months: '18 месяцев', featured: false, profitable: true, paymentPeriods: 17, firstPeriodRate: 5.5 },
];

const amountFormatter = new Intl.NumberFormat('ru-RU');
const currencyFormatter = new Intl.NumberFormat('ru-RU', {
	maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('ru-RU', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export const formatAmount = (value: number) => amountFormatter.format(value);
export const truncateNumber = (value: number) => (value < 0 ? Math.ceil(value) : Math.floor(value));
export const formatCurrency = (value: number) => `${currencyFormatter.format(truncateNumber(value))} ₽`;
export const formatPercent = (value: number) => `${percentFormatter.format(value)} %`;

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const getAmountProgress = (value: number, min: number, max: number) => {
	if (max <= min) {
		return '100%';
	}

	return `${((value - min) / (max - min)) * 100}%`;
};

export const calculateMonthlyPayment = (principal: number, annualRate: number, periods: number) => {
	if (periods <= 0) {
		return 0;
	}

	const monthlyRate = annualRate / 100 / 12;

	if (monthlyRate === 0) {
		return principal / periods;
	}

	return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -periods);
};

export const calculatePlanValues = (
	principal: number,
	discountCount: number,
	config: PlanCalculationConfig,
): CalculatorPlanValues => {
	// Скидки по акциям уменьшают базовую ставку линейно, но не ниже 0%.
	const annualRate = Math.max(0, BASE_ANNUAL_RATE - discountCount);
	const monthlyPayment = roundMoney(calculateMonthlyPayment(principal, annualRate, config.paymentPeriods));
	const firstPeriodCharge = roundMoney(principal * (config.firstPeriodRate / 100));
	const overpayment = roundMoney(monthlyPayment * config.paymentPeriods + firstPeriodCharge - principal);
	const overpaymentRate = principal === 0 ? 0 : (overpayment / principal) * 100;

	return {
		monthlyPayment,
		overpayment,
		overpaymentRate,
	};
};

export const getInitialPlanValues = (principal: number, discountCount = 0) =>
	CALCULATOR_PLANS.map((plan) => calculatePlanValues(principal, discountCount, plan));

export const getInitialCalculatorState = (
	principal = CALCULATOR_AMOUNT_CONFIG.initialValue,
	min = CALCULATOR_AMOUNT_CONFIG.min,
	max = CALCULATOR_AMOUNT_CONFIG.max,
	discountCount = 0,
): CalculatorInitialState => ({
	amountDisplayValue: formatAmount(principal),
	amountProgress: getAmountProgress(principal, min, max),
	planValues: getInitialPlanValues(principal, discountCount),
});

export const INITIAL_CALCULATOR_STATE = getInitialCalculatorState();

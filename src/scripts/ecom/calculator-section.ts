import { calculatePlanValues, formatAmount, formatCurrency, formatPercent } from '../../lib/calculator';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const tabletPerksMedia = window.matchMedia('(max-width: 1024px)');
const compactCardsMedia = window.matchMedia('(max-width: 540px)');
const countDigits = (value: string) => String(value).replace(/\D/g, '').length;
const trimDigits = (value: string, maxDigits: number) => String(value).replace(/\D/g, '').slice(0, maxDigits);

const getCaretFromDigitIndex = (value: string, digitIndex: number) => {
	if (digitIndex <= 0) {
		return 0;
	}

	let passedDigits = 0;

	for (let index = 0; index < value.length; index += 1) {
		if (/\d/.test(value[index])) {
			passedDigits += 1;
		}

		if (passedDigits >= digitIndex) {
			return index + 1;
		}
	}

	return value.length;
};

const easeInOutCubic = (progress: number) =>
	progress < 0.5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;

const scheduleAfterFrames = (callback: () => void, frames = 2) => {
	const run = (remainingFrames: number) => {
		if (remainingFrames <= 0) {
			callback();
			return;
		}

		requestAnimationFrame(() => run(remainingFrames - 1));
	};

	run(frames);
};

const animateNumericText = (
	node: HTMLElement,
	nextValue: number,
	formatter: (value: number) => string,
	duration = 500,
) => {
	const currentAnimationFrame = node.dataset.animationFrame;

	if (currentAnimationFrame) {
		cancelAnimationFrame(Number.parseInt(currentAnimationFrame, 10));
	}

	const previousValue = Number.parseFloat(node.dataset.value || '0');
	const targetValue = Number.isFinite(nextValue) ? nextValue : 0;

	if (prefersReducedMotion.matches || Math.abs(targetValue - previousValue) < 0.01) {
		node.textContent = formatter(targetValue);
		node.dataset.value = String(targetValue);
		delete node.dataset.animationFrame;
		return;
	}

	const startedAt = performance.now();
	const tick = (timestamp: number) => {
		const progress = Math.min((timestamp - startedAt) / duration, 1);
		const animatedValue = previousValue + (targetValue - previousValue) * easeInOutCubic(progress);
		node.textContent = formatter(animatedValue);
		node.dataset.value = String(animatedValue);

		if (progress < 1) {
			node.dataset.animationFrame = String(requestAnimationFrame(tick));
			return;
		}

		node.textContent = formatter(targetValue);
		node.dataset.value = String(targetValue);
		delete node.dataset.animationFrame;
	};

	node.dataset.animationFrame = String(requestAnimationFrame(tick));
};

export const initCalculatorSections = () => {
	for (const calculator of document.querySelectorAll('.calculator-section')) {
		const amountInput = calculator.querySelector('[data-calculator-amount-input]');
		const rangeInput = calculator.querySelector('[data-calculator-range]');
		const trackShell = calculator.querySelector('.calculator-section__track-shell');
		const amountPanel = calculator.querySelector('.calculator-section__panel--amount');
		const plansPanel = calculator.querySelector('.calculator-section__panel--plans');
		const amountRow = calculator.querySelector('[data-calculator-amount-row]');
		const sliderBlock = calculator.querySelector('[data-calculator-slider]');
		const plansHeaderSlot = calculator.querySelector('[data-calculator-plans-header-slot]');
		const perksBlock = calculator.querySelector('[data-calculator-perks]');
		const perksSlot = calculator.querySelector('[data-calculator-perks-slot]');
		const perksMobileSlot = calculator.querySelector('[data-calculator-perks-mobile-slot]');
		const perkInputs = [...calculator.querySelectorAll('.calculator-section__perk-input')].filter(
			(input): input is HTMLInputElement => input instanceof HTMLInputElement,
		);
		const planCards = [...calculator.querySelectorAll('[data-plan-card]')].filter(
			(card): card is HTMLElement => card instanceof HTMLElement,
		);

		if (
			!(amountInput instanceof HTMLInputElement) ||
			!(rangeInput instanceof HTMLInputElement) ||
			!(amountPanel instanceof HTMLElement) ||
			!(plansPanel instanceof HTMLElement) ||
			!(amountRow instanceof HTMLElement) ||
			!(sliderBlock instanceof HTMLElement) ||
			!(plansHeaderSlot instanceof HTMLElement) ||
			!(trackShell instanceof HTMLElement) ||
			!(perksBlock instanceof HTMLElement) ||
			!(perksSlot instanceof HTMLElement) ||
			!(perksMobileSlot instanceof HTMLElement)
		) {
			continue;
		}

		if (calculator instanceof HTMLElement && calculator.dataset.calculatorBound === 'true') {
			continue;
		}

		const baseMin = Number.parseInt(amountInput.dataset.min || rangeInput.min, 10);
		const baseMax = Number.parseInt(amountInput.dataset.max || rangeInput.max, 10);
		const maxDigits = Number.parseInt(amountInput.dataset.maxDigits || '12', 10);
		let currentValue = Number.parseInt(rangeInput.value, 10);
		const perksOriginalParent = perksBlock.parentElement;
		const amountRowOriginalParent = amountRow.parentElement;
		const sliderOriginalParent = sliderBlock.parentElement;

		const syncTabletLayout = () => {
			if (
				!(amountRowOriginalParent instanceof HTMLElement) ||
				!(sliderOriginalParent instanceof HTMLElement)
			) {
				return;
			}

			if (tabletPerksMedia.matches) {
				plansHeaderSlot.append(amountRow, sliderBlock);
				plansHeaderSlot.removeAttribute('hidden');
				plansHeaderSlot.removeAttribute('aria-hidden');
				amountPanel.setAttribute('hidden', '');
				return;
			}

			amountRowOriginalParent.appendChild(amountRow);
			sliderOriginalParent.appendChild(sliderBlock);
			plansHeaderSlot.setAttribute('hidden', '');
			plansHeaderSlot.setAttribute('aria-hidden', 'true');
			amountPanel.removeAttribute('hidden');
		};

		const syncPerksPlacement = () => {
			if (!(perksOriginalParent instanceof HTMLElement)) {
				return;
			}

			if (compactCardsMedia.matches) {
				perksMobileSlot.appendChild(perksBlock);
				perksMobileSlot.removeAttribute('hidden');
				perksMobileSlot.removeAttribute('aria-hidden');
				perksSlot.setAttribute('hidden', '');
				perksSlot.setAttribute('aria-hidden', 'true');
				return;
			}

			if (tabletPerksMedia.matches) {
				perksSlot.appendChild(perksBlock);
				perksSlot.removeAttribute('hidden');
				perksSlot.removeAttribute('aria-hidden');
				perksMobileSlot.setAttribute('hidden', '');
				perksMobileSlot.setAttribute('aria-hidden', 'true');
				return;
			}

			perksOriginalParent.appendChild(perksBlock);
			perksSlot.setAttribute('hidden', '');
			perksSlot.setAttribute('aria-hidden', 'true');
			perksMobileSlot.setAttribute('hidden', '');
			perksMobileSlot.setAttribute('aria-hidden', 'true');
		};

		const updateRangeBounds = (value: number) => {
			const nextMin = Math.min(baseMin, value);
			const nextMax = Math.max(baseMax, value);

			rangeInput.min = String(nextMin);
			rangeInput.max = String(nextMax);
			return { nextMin, nextMax };
		};

		const paintRange = (value: number) => {
			const { nextMin, nextMax } = updateRangeBounds(value);
			const ratio = nextMax === nextMin ? 1 : (value - nextMin) / (nextMax - nextMin);
			const shellWidth = trackShell.clientWidth;
			const calculatorStyles = getComputedStyle(calculator);
			const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
			const thumbSizeVariable = isMobileViewport ? '--calculator-thumb-size-mobile' : '--calculator-thumb-size';
			const trackHeightVariable =
				isMobileViewport ? '--calculator-track-height-mobile' : '--calculator-track-height';
			const thumbSize = Number.parseFloat(calculatorStyles.getPropertyValue(thumbSizeVariable)) || 0;
			const trackHeight = Number.parseFloat(calculatorStyles.getPropertyValue(trackHeightVariable)) || 0;
			const thumbRadius = thumbSize / 2;
			const trackRadius = trackHeight / 2;
			const thumbCoverWidth =
				thumbRadius > 0 && trackRadius > 0 && thumbRadius >= trackRadius
					? Math.sqrt(thumbRadius ** 2 - trackRadius ** 2)
					: thumbRadius;
			const fillWidth =
				ratio <= 0
					? 0
					: ratio >= 1
						? shellWidth
						: ratio * (shellWidth - thumbSize) + thumbCoverWidth;

			rangeInput.value = String(value);
			trackShell.style.setProperty('--range-fill-width', `${fillWidth}px`);
		};

		const updatePlans = (principal: number) => {
			const discountCount = perkInputs.filter((input) => input.checked).length;

			for (const card of planCards) {
				const paymentPeriods = Number.parseInt(card.dataset.paymentPeriods || '0', 10);
				const firstPeriodRate = Number.parseFloat(card.dataset.firstPeriodRate || '0');
				const paymentNode = card.querySelector('[data-plan-payment]');
				const overpaymentNode = card.querySelector('[data-plan-overpayment]');
				const rateNode = card.querySelector('[data-plan-rate]');

				if (!(paymentNode instanceof HTMLElement) || !(overpaymentNode instanceof HTMLElement) || !(rateNode instanceof HTMLElement)) {
					continue;
				}

				const { monthlyPayment, overpayment, overpaymentRate } = calculatePlanValues(principal, discountCount, {
					paymentPeriods,
					firstPeriodRate,
				});

				card.classList.add('calculator-card--updating');
				clearTimeout(card.dataset.updateTimeout ? Number.parseInt(card.dataset.updateTimeout, 10) : undefined);
				card.dataset.updateTimeout = String(
					window.setTimeout(() => {
						card.classList.remove('calculator-card--updating');
						delete card.dataset.updateTimeout;
					}, 380),
				);

				animateNumericText(paymentNode, monthlyPayment, formatCurrency);
				animateNumericText(overpaymentNode, overpayment, formatCurrency);
				animateNumericText(rateNode, overpaymentRate, formatPercent);
			}
		};

		const commitInputValue = (rawValue: number) => {
			if (Number.isNaN(rawValue)) {
				return;
			}

			currentValue = rawValue;
			amountInput.value = formatAmount(currentValue);
			paintRange(currentValue);
			updatePlans(currentValue);
		};

		const syncCardDetailsLayout = () => {
			for (const card of planCards) {
				const toggle = card.querySelector('[data-calculator-card-toggle]');
				const details = card.querySelector('[data-calculator-card-details]');

				if (!(toggle instanceof HTMLButtonElement) || !(details instanceof HTMLElement)) {
					continue;
				}

				if (!compactCardsMedia.matches) {
					card.classList.remove('is-expanded');
					toggle.setAttribute('aria-expanded', 'false');
					return;
				}
			}
		};

		commitInputValue(currentValue);
		syncTabletLayout();
		syncPerksPlacement();
		syncCardDetailsLayout();

		const syncResponsiveLayout = () => {
			syncTabletLayout();
			syncPerksPlacement();
			syncCardDetailsLayout();
			paintRange(currentValue);
		};

		const syncRangeAfterLayout = () => {
			scheduleAfterFrames(() => {
				paintRange(currentValue);
			});
		};

		rangeInput.addEventListener('input', () => {
			const nextValue = Number.parseInt(rangeInput.value, 10);
			currentValue = nextValue;
			amountInput.value = formatAmount(nextValue);
			paintRange(nextValue);
		});

		rangeInput.addEventListener('change', () => {
			const nextValue = Number.parseInt(rangeInput.value, 10);
			commitInputValue(nextValue);
		});

		amountInput.addEventListener('input', () => {
			const selectionStart = amountInput.selectionStart ?? amountInput.value.length;
			const digitsBeforeCaret = countDigits(amountInput.value.slice(0, selectionStart));
			const trimmedDigits = trimDigits(amountInput.value, maxDigits);
			const parsed = Number.parseInt(trimmedDigits || '0', 10);

			currentValue = parsed;
			amountInput.value = formatAmount(parsed);
			const nextCaretPosition = getCaretFromDigitIndex(amountInput.value, digitsBeforeCaret);
			amountInput.setSelectionRange(nextCaretPosition, nextCaretPosition);
			paintRange(parsed);
		});

		amountInput.addEventListener('blur', () => {
			const parsed = Number.parseInt(trimDigits(amountInput.value, maxDigits), 10);
			const normalizedValue = Number.isNaN(parsed) ? currentValue : Math.min(baseMax, Math.max(baseMin, parsed));
			commitInputValue(normalizedValue);
		});

		amountInput.addEventListener('focus', () => {
			amountInput.value = formatAmount(currentValue);
		});

		amountInput.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter') {
				return;
			}

			event.preventDefault();
			const parsed = Number.parseInt(trimDigits(amountInput.value, maxDigits), 10);
			const normalizedValue = Number.isNaN(parsed) ? currentValue : Math.min(baseMax, Math.max(baseMin, parsed));
			commitInputValue(normalizedValue);
			amountInput.blur();
		});

		amountInput.addEventListener('paste', (event) => {
			const pastedText = event.clipboardData?.getData('text') ?? '';
			const selectionStart = amountInput.selectionStart ?? amountInput.value.length;
			const selectionEnd = amountInput.selectionEnd ?? amountInput.value.length;
			const nextRawValue = `${amountInput.value.slice(0, selectionStart)}${pastedText}${amountInput.value.slice(selectionEnd)}`;
			const nextDigits = trimDigits(nextRawValue, maxDigits);

			if (countDigits(nextRawValue) <= maxDigits) {
				return;
			}

			event.preventDefault();

			if (!nextDigits) {
				amountInput.value = '';
				return;
			}

			const formattedValue = formatAmount(Number.parseInt(nextDigits, 10));
			amountInput.value = formattedValue;
			currentValue = Number.parseInt(nextDigits, 10);
			paintRange(currentValue);

			const caretDigitIndex = Math.min(countDigits(amountInput.value.slice(0, selectionStart)) + countDigits(pastedText), maxDigits);
			const caretPosition = getCaretFromDigitIndex(formattedValue, caretDigitIndex);
			amountInput.setSelectionRange(caretPosition, caretPosition);
		});

		for (const perkInput of perkInputs) {
			perkInput.addEventListener('change', () => {
				updatePlans(currentValue);
			});
		}

		for (const card of planCards) {
			const toggle = card.querySelector('[data-calculator-card-toggle]');
			const details = card.querySelector('[data-calculator-card-details]');

			if (!(toggle instanceof HTMLButtonElement) || !(details instanceof HTMLElement)) {
				continue;
			}

			toggle.addEventListener('click', () => {
				if (!compactCardsMedia.matches) {
					return;
				}

				const nextExpanded = !card.classList.contains('is-expanded');
				card.classList.toggle('is-expanded', nextExpanded);
				toggle.setAttribute('aria-expanded', String(nextExpanded));
			});
		}

		window.addEventListener('resize', syncResponsiveLayout);
		tabletPerksMedia.addEventListener('change', syncTabletLayout);
		tabletPerksMedia.addEventListener('change', syncPerksPlacement);
		compactCardsMedia.addEventListener('change', syncCardDetailsLayout);
		tabletPerksMedia.addEventListener('change', syncRangeAfterLayout);
		compactCardsMedia.addEventListener('change', syncRangeAfterLayout);

		const trackResizeObserver = new ResizeObserver(() => {
			paintRange(currentValue);
		});
		trackResizeObserver.observe(trackShell);

		window.addEventListener('load', () => {
			requestAnimationFrame(syncResponsiveLayout);
		});

		syncRangeAfterLayout();

		calculator.classList.remove('calculator-section--pending');
		if (calculator instanceof HTMLElement) {
			calculator.dataset.calculatorBound = 'true';
			calculator.dataset.calculatorReady = 'true';
		}
	}
};

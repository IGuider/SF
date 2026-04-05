const transitionHandlers = new WeakMap<HTMLElement, EventListener>();
const animationFrames = new WeakMap<HTMLElement, number>();
const resizeHandlers = new Map<string, EventListener>();

const clearScheduledState = (panel: HTMLElement) => {
	const transitionHandler = transitionHandlers.get(panel);

	if (transitionHandler) {
		panel.removeEventListener('transitionend', transitionHandler);
		transitionHandlers.delete(panel);
	}

	const animationFrame = animationFrames.get(panel);

	if (animationFrame !== undefined) {
		cancelAnimationFrame(animationFrame);
		animationFrames.delete(panel);
	}
};

type AccordionConfig = {
	rootSelector: string;
	itemSelector: string;
	triggerSelector: string;
	panelSelector: string;
	panelInnerSelector: string;
	openClass: string;
};

const setPanelState = (item: Element, expanded: boolean, config: AccordionConfig) => {
	const trigger = item.querySelector(config.triggerSelector);
	const panel = item.querySelector(config.panelSelector);
	const panelInner = item.querySelector(config.panelInnerSelector);

	if (!(trigger instanceof HTMLButtonElement) || !(panel instanceof HTMLElement) || !(panelInner instanceof HTMLElement)) {
		return;
	}

	clearScheduledState(panel);
	trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');

	const onTransitionEnd: EventListener = (event) => {
		if (!(event instanceof TransitionEvent) || event.propertyName !== 'height') {
			return;
		}

		panel.removeEventListener('transitionend', onTransitionEnd);
		transitionHandlers.delete(panel);

		if (expanded) {
			panel.style.height = 'auto';
			return;
		}

		panel.hidden = true;
	};

	transitionHandlers.set(panel, onTransitionEnd);
	panel.addEventListener('transitionend', onTransitionEnd);

	if (expanded) {
		panel.hidden = false;
		panel.style.height = '0px';
		void panel.offsetHeight;
		item.classList.add(config.openClass);

		const animationFrame = requestAnimationFrame(() => {
			panel.style.height = `${panelInner.offsetHeight}px`;
			animationFrames.delete(panel);
		});

		animationFrames.set(panel, animationFrame);
		return;
	}

	panel.style.height = `${panelInner.offsetHeight}px`;
	void panel.offsetHeight;
	item.classList.remove(config.openClass);

	const animationFrame = requestAnimationFrame(() => {
		panel.style.height = '0px';
		animationFrames.delete(panel);
	});

	animationFrames.set(panel, animationFrame);
};

const initAccordionGroup = (config: AccordionConfig) => {
	const accordions = Array.from(document.querySelectorAll(`${config.rootSelector} ${config.itemSelector}`));

	accordions.forEach((item) => {
		const trigger = item.querySelector(config.triggerSelector);
		const panel = item.querySelector(config.panelSelector);
		const panelInner = item.querySelector(config.panelInnerSelector);

		if (!(trigger instanceof HTMLButtonElement) || !(panel instanceof HTMLElement) || !(panelInner instanceof HTMLElement)) {
			return;
		}

		if (item.classList.contains(config.openClass)) {
			panel.hidden = false;
			panel.style.height = 'auto';
		} else {
			panel.hidden = true;
			panel.style.height = '0px';
		}

		trigger.addEventListener('click', () => {
			const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
			setPanelState(item, !isExpanded, config);
		});
	});

	const existingResizeHandler = resizeHandlers.get(config.rootSelector);

	if (existingResizeHandler) {
		window.removeEventListener('resize', existingResizeHandler);
	}

	const resizeHandler: EventListener = () => {
		accordions.forEach((item) => {
			if (!item.classList.contains(config.openClass)) {
				return;
			}

			const panel = item.querySelector(config.panelSelector);
			const panelInner = item.querySelector(config.panelInnerSelector);

			if (panel instanceof HTMLElement && panelInner instanceof HTMLElement) {
				panel.style.height = `${panelInner.offsetHeight}px`;

				requestAnimationFrame(() => {
					if (item.classList.contains(config.openClass)) {
						panel.style.height = 'auto';
					}
				});
			}
		});
	};

	resizeHandlers.set(config.rootSelector, resizeHandler);
	window.addEventListener('resize', resizeHandler);
};

export const initFaqSections = () => {
	initAccordionGroup({
		rootSelector: '.faq-section',
		itemSelector: '.faq-item',
		triggerSelector: '.faq-item__summary',
		panelSelector: '.faq-item__content',
		panelInnerSelector: '.faq-item__content-inner',
		openClass: 'is-open',
	});
};

export const initFooterDisclosure = () => {
	initAccordionGroup({
		rootSelector: '.site-footer',
		itemSelector: '.site-footer__disclosure',
		triggerSelector: '.site-footer__entity',
		panelSelector: '.site-footer__details',
		panelInnerSelector: '.site-footer__details-inner',
		openClass: 'is-open',
	});
};

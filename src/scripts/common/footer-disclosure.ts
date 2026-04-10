import { initAccordionGroup } from './accordion';

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

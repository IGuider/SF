import Swiper from 'swiper';
import { A11y } from 'swiper/modules';
import 'swiper/css';

export const initClientsSection = () => {
	for (const section of document.querySelectorAll('[data-clients-section]')) {
		if (!(section instanceof HTMLElement)) {
			continue;
		}

		if (section.dataset.clientsBound === 'true') {
			continue;
		}

		const slider = section.querySelector('[data-clients-slider]');
		const nextButtons = section.querySelectorAll('[data-client-next]');

		if (!(slider instanceof HTMLElement)) {
			continue;
		}

		const slideCount = Number(section.dataset.clientsCount ?? '0');
		const hasMultipleSlides = slideCount > 1;

		const swiper = new Swiper(slider, {
			modules: [A11y],
			slidesPerView: 1,
			spaceBetween: 24,
			speed: 650,
			autoHeight: true,
			loop: hasMultipleSlides,
			allowTouchMove: false,
			a11y: {
				enabled: true,
				containerMessage: 'Слайдер с кейсами клиентов',
				slideRole: 'group',
			},
		});

		for (const button of nextButtons) {
			if (button instanceof HTMLButtonElement) {
				button.disabled = !hasMultipleSlides;
			}
		}

		section.classList.remove('clients-section--pending');
		section.dataset.clientsReady = 'true';

		section.addEventListener('click', (event) => {
			const target = event.target;

			if (!(target instanceof Element)) {
				return;
			}

			const button = target.closest('[data-client-next]');

			if (!(button instanceof HTMLButtonElement) || !section.contains(button) || !hasMultipleSlides) {
				return;
			}

			swiper.slideNext();
		});

		section.dataset.clientsBound = 'true';
	}
};

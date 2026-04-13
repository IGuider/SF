export const initProductsSection = () => {
	const sections = document.querySelectorAll('.products-section');

	for (const card of document.querySelectorAll('.products-card')) {
		if (!(card instanceof HTMLElement)) {
			continue;
		}

		if (card.dataset.productsCardBound === 'true') {
			continue;
		}

		const toggle = card.querySelector('[data-products-card-toggle]');
		const frontFace = card.querySelector('.products-card__face--front');

		if (!(toggle instanceof HTMLButtonElement)) {
			continue;
		}

		if (!(frontFace instanceof HTMLElement)) {
			continue;
		}

		const syncState = (isFlipped: boolean) => {
			card.classList.toggle('is-flipped', isFlipped);
			toggle.setAttribute('aria-expanded', String(isFlipped));
		};

		frontFace.addEventListener('click', () => {
			syncState(!card.classList.contains('is-flipped'));
		});

		card.addEventListener('mouseleave', () => {
			syncState(false);
		});

		card.dataset.productsCardBound = 'true';
	}

	for (const section of sections) {
		if (section instanceof HTMLElement) {
			section.classList.remove('products-section--pending');
			section.dataset.productsReady = 'true';
		}
	}
};

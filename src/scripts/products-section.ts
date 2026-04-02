export const initProductsSection = () => {
	for (const card of document.querySelectorAll('.products-card')) {
		if (!(card instanceof HTMLElement)) {
			continue;
		}

		const toggle = card.querySelector('[data-products-card-toggle]');

		if (!(toggle instanceof HTMLButtonElement)) {
			continue;
		}

		const syncState = (isFlipped: boolean) => {
			card.classList.toggle('is-flipped', isFlipped);
			toggle.setAttribute('aria-expanded', String(isFlipped));
		};

		toggle.addEventListener('click', () => {
			syncState(!card.classList.contains('is-flipped'));
		});

		card.addEventListener('mouseleave', () => {
			syncState(false);
		});
	}
};

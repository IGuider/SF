const VISIBLE_OFFSET = 420;

export const initScrollToTop = () => {
	const button = document.querySelector<HTMLElement>('[data-scroll-to-top]');

	if (!(button instanceof HTMLButtonElement)) {
		return;
	}

	if (button.dataset.scrollToTopBound === 'true') {
		return;
	}

	const syncVisibility = () => {
		button.dataset.visible = window.scrollY > VISIBLE_OFFSET ? 'true' : 'false';
	};

	button.addEventListener('click', () => {
		window.scrollTo({
			top: 0,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
		});
	});

	window.addEventListener('scroll', syncVisibility, { passive: true });
	button.dataset.scrollToTopBound = 'true';
	syncVisibility();
};

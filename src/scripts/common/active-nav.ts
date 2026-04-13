const ACTIVE_NAV_SELECTOR = '.site-header__nav a[href]';
const ACTIVE_SECTION_OFFSET = 120;
let cleanupActiveNav: (() => void) | null = null;

const getAnchorParts = (link: HTMLAnchorElement) => {
	const url = new URL(link.href, window.location.href);

	return {
		hash: url.hash,
		pathname: url.pathname.replace(/\/index\.html$/, '/'),
	};
};

const getCurrentPathname = () => window.location.pathname.replace(/\/index\.html$/, '/');

const setActiveLink = (activeLink: HTMLAnchorElement | null) => {
	document.querySelectorAll<HTMLAnchorElement>(ACTIVE_NAV_SELECTOR).forEach((link) => {
		if (link === activeLink) {
			link.setAttribute('aria-current', 'page');
			return;
		}

		link.removeAttribute('aria-current');
	});
};

const findPageLink = () => {
	const currentPathname = getCurrentPathname();

	return [...document.querySelectorAll<HTMLAnchorElement>(ACTIVE_NAV_SELECTOR)].find((link) => {
		const { hash, pathname } = getAnchorParts(link);

		return !hash && pathname === currentPathname;
	}) ?? null;
};

const findSectionLink = () => {
	const currentPathname = getCurrentPathname();
	const sectionLinks = [...document.querySelectorAll<HTMLAnchorElement>(ACTIVE_NAV_SELECTOR)].filter((link) => {
		const { hash, pathname } = getAnchorParts(link);

		return Boolean(hash) && pathname === currentPathname && document.querySelector(hash);
	});

	let activeLink: HTMLAnchorElement | null = null;
	let closestOffset = Number.NEGATIVE_INFINITY;

	for (const link of sectionLinks) {
		const { hash } = getAnchorParts(link);
		const section = document.querySelector(hash);

		if (!(section instanceof HTMLElement)) {
			continue;
		}

		const offset = section.getBoundingClientRect().top - ACTIVE_SECTION_OFFSET;

		if (offset <= 0 && offset > closestOffset) {
			activeLink = link;
			closestOffset = offset;
		}
	}

	return activeLink;
};

export const initActiveNav = () => {
	cleanupActiveNav?.();

	const syncActiveNav = () => {
		setActiveLink(findSectionLink() ?? findPageLink());
	};

	syncActiveNav();
	window.addEventListener('scroll', syncActiveNav, { passive: true });
	window.addEventListener('hashchange', syncActiveNav);

	cleanupActiveNav = () => {
		window.removeEventListener('scroll', syncActiveNav);
		window.removeEventListener('hashchange', syncActiveNav);
	};
};

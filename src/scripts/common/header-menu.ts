import { navigate } from 'astro:transitions/client';

const MOBILE_BREAKPOINT = 768;
const BODY_OPEN_CLASS = 'site-header-menu-open';
const HEADER_OPEN_CLASS = 'is-menu-open';
const HEADER_CLOSING_CLASS = 'is-menu-closing';
const HEADER_STICKY_ACTIVE_CLASS = 'is-sticky-active';
const MENU_CLOSE_DELAY_MS = 260;
const MOBILE_NAVIGATION_DELAY_MS = 150;
const MENU_OPEN_LABEL = 'Открыть меню';
const MENU_CLOSE_LABEL = 'Закрыть меню';

const isDeferredMobileNavigation = (link: HTMLAnchorElement) => {
	if (link.target && link.target !== '_self') {
		return false;
	}

	if (link.hasAttribute('download')) {
		return false;
	}

	const href = link.getAttribute('href');

	if (!href || href === '#') {
		return false;
	}

	if (/^(mailto:|tel:|javascript:)/i.test(href)) {
		return false;
	}

	const url = new URL(link.href, window.location.href);

	return url.origin === window.location.origin;
};

const finishCloseMenu = (header: HTMLElement, toggle: HTMLButtonElement) => {
	header.classList.remove(HEADER_CLOSING_CLASS);
	header.classList.remove(HEADER_OPEN_CLASS);
	toggle.setAttribute('aria-expanded', 'false');
	toggle.setAttribute('aria-label', MENU_OPEN_LABEL);
	document.body.classList.remove(BODY_OPEN_CLASS);
};

const closeMenu = (
	header: HTMLElement,
	toggle: HTMLButtonElement,
	closeTimerRef: { current: number | null },
	force = false,
) => {
	if (closeTimerRef.current !== null) {
		window.clearTimeout(closeTimerRef.current);
		closeTimerRef.current = null;
	}

	if (force) {
		finishCloseMenu(header, toggle);
		return;
	}

	header.classList.add(HEADER_CLOSING_CLASS);
	toggle.setAttribute('aria-expanded', 'false');
	toggle.setAttribute('aria-label', MENU_OPEN_LABEL);

	closeTimerRef.current = window.setTimeout(() => {
		finishCloseMenu(header, toggle);
		closeTimerRef.current = null;
	}, MENU_CLOSE_DELAY_MS);
};

const openMenu = (header: HTMLElement, toggle: HTMLButtonElement, closeTimerRef: { current: number | null }) => {
	if (closeTimerRef.current !== null) {
		window.clearTimeout(closeTimerRef.current);
		closeTimerRef.current = null;
	}

	header.classList.remove(HEADER_CLOSING_CLASS);
	header.classList.add(HEADER_OPEN_CLASS);
	toggle.setAttribute('aria-expanded', 'true');
	toggle.setAttribute('aria-label', MENU_CLOSE_LABEL);
	document.body.classList.add(BODY_OPEN_CLASS);
};

export const initHeaderMenu = () => {
	const header = document.querySelector('.site-header');

	if (!(header instanceof HTMLElement)) {
		return;
	}

	if (header.dataset.headerMenuBound === 'true') {
		return;
	}

	const toggle = header.querySelector('.site-header__toggle');
	const menu = header.querySelector('.site-header__menu');

	if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) {
		return;
	}

	const closeTimerRef = { current: null as number | null };

	const syncStickyState = () => {
		const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT;
		const isScrolled = window.scrollY > 0;

		header.classList.toggle(HEADER_STICKY_ACTIVE_CLASS, isMobileViewport && isScrolled);
	};

	const handleToggleClick = () => {
		const isOpen = header.classList.contains(HEADER_OPEN_CLASS);

		if (isOpen) {
			closeMenu(header, toggle, closeTimerRef);
			return;
		}

		openMenu(header, toggle, closeTimerRef);
	};

	const handleDocumentClick = (event: Event) => {
		if (window.innerWidth > MOBILE_BREAKPOINT || !header.classList.contains(HEADER_OPEN_CLASS)) {
			return;
		}

		const target = event.target;

		if (target instanceof Node && !header.contains(target)) {
			closeMenu(header, toggle, closeTimerRef);
		}
	};

	const handleDocumentKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			closeMenu(header, toggle, closeTimerRef);
		}
	};

	const handleResize = () => {
		if (window.innerWidth > MOBILE_BREAKPOINT) {
			closeMenu(header, toggle, closeTimerRef, true);
		}

		syncStickyState();
	};

	const closeOnMenuAction = (event: Event) => {
		const target = event.target;

		if (!(target instanceof Element) || window.innerWidth > MOBILE_BREAKPOINT) {
			return;
		}

		const link = target.closest('a');

		if (link instanceof HTMLAnchorElement && header.classList.contains(HEADER_OPEN_CLASS)) {
			if (isDeferredMobileNavigation(link)) {
				event.preventDefault();
				const href = link.href;

				closeMenu(header, toggle, closeTimerRef);
				window.setTimeout(() => {
					navigate(href);
				}, MENU_CLOSE_DELAY_MS + MOBILE_NAVIGATION_DELAY_MS);
				return;
			}

			closeMenu(header, toggle, closeTimerRef);
			return;
		}

		if (target.closest('button')) {
			closeMenu(header, toggle, closeTimerRef);
		}
	};

	toggle.addEventListener('click', handleToggleClick);
	document.addEventListener('click', handleDocumentClick);
	document.addEventListener('keydown', handleDocumentKeydown);
	window.addEventListener('resize', handleResize);
	window.addEventListener('scroll', syncStickyState, { passive: true });
	menu.addEventListener('click', closeOnMenuAction);
	header.dataset.headerMenuBound = 'true';
	syncStickyState();
};

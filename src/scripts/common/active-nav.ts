const ACTIVE_NAV_SELECTOR = ".site-header__nav a[href]";
let cleanupActiveNav: (() => void) | null = null;

const getAnchorParts = (link: HTMLAnchorElement) => {
  const url = new URL(link.href, window.location.href);

  return {
    hash: url.hash,
    pathname: url.pathname.replace(/\/index\.html$/, "/"),
  };
};

const getCurrentPathname = () =>
  window.location.pathname.replace(/\/index\.html$/, "/");

const isPrimaryNavLink = (link: HTMLAnchorElement) =>
  link.classList.contains("site-header__nav-link") ||
  link.classList.contains("site-header__submenu-link--group");

const getEquivalentLinks = (activeLink: HTMLAnchorElement | null) => {
  if (!activeLink) {
    return [];
  }

  const activeParts = getAnchorParts(activeLink);

  return [
    ...document.querySelectorAll<HTMLAnchorElement>(ACTIVE_NAV_SELECTOR),
  ].filter((link) => {
    const parts = getAnchorParts(link);

    return parts.pathname === activeParts.pathname && parts.hash === activeParts.hash;
  });
};

const setActiveLinks = (activeLinks: HTMLAnchorElement[]) => {
  const activeSet = new Set(activeLinks);

  document
    .querySelectorAll<HTMLAnchorElement>(ACTIVE_NAV_SELECTOR)
    .forEach((link) => {
      if (activeSet.has(link)) {
        link.setAttribute("aria-current", "page");
        return;
      }

      link.removeAttribute("aria-current");
    });
};

const preventCurrentPageNavigation = (event: MouseEvent) => {
  const activeLink = (event.target as Element | null)?.closest<HTMLAnchorElement>(
    ".site-header__nav-link[aria-current='page']",
  );

  if (!activeLink) {
    return;
  }

  event.preventDefault();
};

const findPageLink = () => {
  const currentPathname = getCurrentPathname();
  const matchingLinks = [
    ...document.querySelectorAll<HTMLAnchorElement>(ACTIVE_NAV_SELECTOR),
  ].filter((link) => {
    const { hash, pathname } = getAnchorParts(link);

    return !hash && pathname === currentPathname;
  });

  const primaryLink = matchingLinks.find(isPrimaryNavLink);

  return primaryLink ?? matchingLinks[0] ?? null;
};

export const initActiveNav = () => {
  cleanupActiveNav?.();
  const abortController = new AbortController();

  const syncActiveNav = () => {
    const activeLink = findPageLink();
    const equivalentLinks = getEquivalentLinks(activeLink);
    const activeLinks =
      equivalentLinks.some(isPrimaryNavLink) && activeLink && isPrimaryNavLink(activeLink)
        ? equivalentLinks.filter(isPrimaryNavLink)
        : equivalentLinks;

    setActiveLinks(activeLinks);
  };

  syncActiveNav();
  document.addEventListener("click", preventCurrentPageNavigation, {
    capture: true,
    signal: abortController.signal,
  });

  cleanupActiveNav = () => {
    abortController.abort();
    setActiveLinks([]);
  };

  return cleanupActiveNav;
};

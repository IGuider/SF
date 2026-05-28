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

  cleanupActiveNav = () => {
    setActiveLinks([]);
  };

  return cleanupActiveNav;
};

const siteHeader = document.querySelector('.site-header');
const menuToggle = document.querySelector('.site-header__menu-toggle');
const mobileMenu = document.querySelector('.site-header__mobile-menu');
const mobileLinks = document.querySelectorAll('.site-header__mobile-link');
const themeToggles = document.querySelectorAll('.site-header__theme-toggle');
const themeIcons = document.querySelectorAll('.site-header__theme-icon');
const featuresLinks = document.querySelectorAll('a[href="#features"]');
const featuresSection = document.querySelector('#features');
const safetyLinks = document.querySelectorAll('a[href="#safety"]');
const safetySection = document.querySelector('#safety');
const howLinks = document.querySelectorAll('a[href="#how-it-works"]');
const howSection = document.querySelector('#how-it-works');
let lastScrollPosition = window.scrollY;
let scrollTicking = false;

const animateThemeIcon = () => {
    themeIcons.forEach((icon) => {
        icon.classList.remove('site-header__theme-icon--animate');
        void icon.offsetWidth;
        icon.classList.add('site-header__theme-icon--animate');
    });
};

const setTheme = (theme) => {
    document.body.dataset.theme = theme;
    themeToggles.forEach((toggle) => {
        toggle.setAttribute('aria-pressed', String(theme === 'dark'));
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
    localStorage.setItem('omiglpro-theme', theme);
    animateThemeIcon();
};

const savedTheme = localStorage.getItem('omiglpro-theme');
setTheme(savedTheme === 'light' ? 'light' : 'dark');

themeToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
        const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    });
});

const setMenuState = (isOpen) => {
    siteHeader.classList.toggle('site-header--menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
};

menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    setMenuState(!isOpen);
});

document.addEventListener('pointerdown', (event) => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    const clickedInsideMenu = mobileMenu.contains(event.target);
    const clickedMenuToggle = menuToggle.contains(event.target);

    if (isOpen && !clickedInsideMenu && !clickedMenuToggle) {
        setMenuState(false);
    }
});

mobileLinks.forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
});

featuresLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        if (!featuresSection) {
            return;
        }

        event.preventDefault();
        setMenuState(false);
        featuresSection.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
        });
    });
});

safetyLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        if (!safetySection) {
            return;
        }

        event.preventDefault();
        setMenuState(false);
        safetySection.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
        });
    });
});

howLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        if (!howSection) {
            return;
        }

        event.preventDefault();
        setMenuState(false);
        howSection.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
        });
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuState(false);
        menuToggle.focus();
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 820) {
        setMenuState(false);
    }
});

const updateHeaderOnScroll = () => {
    const currentScrollPosition = window.scrollY;
    const scrollDelta = currentScrollPosition - lastScrollPosition;

    if (currentScrollPosition <= 16) {
        siteHeader.classList.remove('site-header--scrolled');
        siteHeader.classList.remove('site-header--scroll-hidden');
    } else {
        siteHeader.classList.add('site-header--scrolled');

        if (scrollDelta > 4) {
            siteHeader.classList.add('site-header--scroll-hidden');
            setMenuState(false);
        } else if (scrollDelta < -4) {
            siteHeader.classList.remove('site-header--scroll-hidden');
        }
    }

    lastScrollPosition = currentScrollPosition;
    scrollTicking = false;
};

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        window.requestAnimationFrame(updateHeaderOnScroll);
        scrollTicking = true;
    }
}, { passive: true });

const revealItems = document.querySelectorAll('.conversation-section [data-reveal]');
const connectionSection = document.querySelector('.connection-section');

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

const typeNode = async (node, speed) => {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        node.textContent = '';

        for (const character of text) {
            node.textContent += character;
            if (speed > 0) {
                await wait(speed);
            }
        }

        return;
    }

    for (const child of Array.from(node.childNodes)) {
        await typeNode(child, speed);
    }
};

const startConversationTyping = async () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heading = document.querySelector('.conversation-section__title');
    const description = document.querySelector('.conversation-section__description');
    const typingSpeed = prefersReducedMotion ? 0 : 42;

    revealItems.forEach((item) => item.classList.add('is-visible'));
    await typeNode(heading, typingSpeed);
    await wait(prefersReducedMotion ? 0 : 180);
    await typeNode(description, prefersReducedMotion ? 0 : 24);
};

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                startConversationTyping();
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '-35% 0px -30% 0px', threshold: 0 });

    revealObserver.observe(document.querySelector('.conversation-section'));
} else {
    startConversationTyping();
}

if (connectionSection) {
    const connectionRevealItems = connectionSection.querySelectorAll('.connection-section__content, .connection-section__visual');

    if ('IntersectionObserver' in window) {
        const connectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    connectionRevealItems.forEach((item) => item.classList.add('is-visible'));
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '-15% 0px -15% 0px', threshold: 0 });

        connectionObserver.observe(connectionSection);
    } else {
        connectionRevealItems.forEach((item) => item.classList.add('is-visible'));
    }
}

if (featuresSection) {
    if ('IntersectionObserver' in window) {
        const featuresObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    featuresSection.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '-12% 0px -12% 0px', threshold: 0 });

        featuresObserver.observe(featuresSection);
    } else {
        featuresSection.classList.add('is-visible');
    }
}

if (safetySection) {
    if ('IntersectionObserver' in window) {
        const safetyObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    safetySection.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '-12% 0px -12% 0px', threshold: 0 });

        safetyObserver.observe(safetySection);
    } else {
        safetySection.classList.add('is-visible');
    }
}

if (howSection) {
    if ('IntersectionObserver' in window) {
        const howObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    howSection.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '-12% 0px -12% 0px', threshold: 0 });

        howObserver.observe(howSection);
    } else {
        howSection.classList.add('is-visible');
    }
}
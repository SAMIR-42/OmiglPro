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

const chatModal = document.querySelector('#chat-modal');
const chatDialog = chatModal?.querySelector('.chat-modal__dialog');
const chatForm = document.querySelector('#chat-form');
const chatName = document.querySelector('#chat-name');
const chatNameMessage = document.querySelector('#chat-name-message');
const genderInputs = document.querySelectorAll('input[name="gender"]');
const countryPicker = document.querySelector('#country-picker');
const countryTrigger = document.querySelector('#country-picker-trigger');
const countryMenu = document.querySelector('#country-picker-menu');
const countrySearch = document.querySelector('#chat-country-search');
const countryList = document.querySelector('#country-list');
const countryInput = document.querySelector('#chat-country');
const countrySelected = document.querySelector('.country-picker__selected');
const countryEmpty = document.querySelector('.country-picker__empty');
const adultInput = document.querySelector('#chat-adult');
const joinButton = document.querySelector('.chat-form__submit');
const startChatLinks = document.querySelectorAll('a[href="#start-chat"]');
let lastFocusedElement = null;

const countries = [
    ['United States', 'US'], ['Canada', 'CA'], ['United Kingdom', 'GB'], ['Australia', 'AU'],
    ['Germany', 'DE'], ['France', 'FR'], ['Spain', 'ES'], ['Italy', 'IT'], ['Brazil', 'BR'],
    ['Mexico', 'MX'], ['India', 'IN'], ['Japan', 'JP'], ['South Korea', 'KR'], ['Philippines', 'PH'],
    ['Nigeria', 'NG'], ['South Africa', 'ZA'], ['Turkey', 'TR'], ['United Arab Emirates', 'AE'],
    ['Sweden', 'SE'], ['Netherlands', 'NL']
];

const normalizeName = (value) => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[04@]/g, (character) => ({ '0': 'o', '4': 'a', '@': 'a' })[character])
    .replace(/[1!]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[5$]/g, 's')
    .replace(/[^a-z0-9]/g, '');

const hasBlockedName = (value) => {
    const normalized = normalizeName(value);
    return window.omiglproBlockedWords.some((word) => normalized.includes(normalizeName(word)));
};

const isValidName = (value) => /^[A-Za-z]{1,7}$/.test(value);

const closeCountryMenu = () => {
    countryMenu.hidden = true;
    countryTrigger.setAttribute('aria-expanded', 'false');
};

const renderCountries = (query = '') => {
    const normalizedQuery = query.trim().toLowerCase();
    const visibleCountries = countries.filter(([name]) => name.toLowerCase().includes(normalizedQuery));
    countryList.innerHTML = visibleCountries.map(([name, code]) => `
        <li role="presentation">
            <button class="country-option" type="button" role="option" data-country="${name}" data-code="${code}">
                <img src="./assets/images/icons/country-flag.svg" alt="" aria-hidden="true"><span>${name}</span>
            </button>
        </li>
    `).join('');
    countryEmpty.hidden = visibleCountries.length > 0;
};

const updateJoinState = () => {
    const name = chatName.value.trim();
    const nameIsValid = isValidName(name) && !hasBlockedName(name);
    const genderIsSelected = Boolean(document.querySelector('input[name="gender"]:checked'));
    joinButton.disabled = !(nameIsValid && genderIsSelected && countryInput.value && adultInput.checked);
};

const validateName = () => {
    const name = chatName.value.trim();
    if (name && !isValidName(name)) {
        chatNameMessage.textContent = 'Name must be 1 to 7 letters.';
    } else if (name && hasBlockedName(name)) {
        chatNameMessage.textContent = 'Please choose a different name.';
    } else {
        chatNameMessage.textContent = '';
    }
    updateJoinState();
};

const setCountry = (name, code) => {
    countryInput.value = name;
    countrySelected.innerHTML = `<img src="./assets/images/icons/country-flag.svg" alt="" aria-hidden="true"><span>${name}</span>`;
    countrySelected.dataset.code = code;
    closeCountryMenu();
    updateJoinState();
};

const closeChatModal = () => {
    chatModal.classList.remove('is-open');
    chatModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-is-open');
    closeCountryMenu();
    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
};

const openChatModal = (event) => {
    event.preventDefault();
    lastFocusedElement = event.currentTarget;
    chatModal.classList.add('is-open');
    chatModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-is-open');
    window.setTimeout(() => chatName.focus(), 80);
};

renderCountries();
startChatLinks.forEach((link) => link.addEventListener('click', openChatModal));
chatModal.querySelectorAll('[data-modal-close]').forEach((element) => element.addEventListener('click', closeChatModal));
chatName.addEventListener('input', validateName);
genderInputs.forEach((input) => input.addEventListener('change', updateJoinState));
adultInput.addEventListener('change', updateJoinState);

countryTrigger.addEventListener('click', () => {
    const isOpen = !countryMenu.hidden;
    countryMenu.hidden = isOpen;
    countryTrigger.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) {
        countrySearch.value = '';
        renderCountries();
        window.setTimeout(() => countrySearch.focus(), 0);
    }
});

countrySearch.addEventListener('input', (event) => renderCountries(event.target.value));
countryList.addEventListener('click', (event) => {
    const option = event.target.closest('[data-country]');
    if (option) {
        setCountry(option.dataset.country, option.dataset.code);
    }
});

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    validateName();
    if (joinButton.disabled) {
        return;
    }

    sessionStorage.setItem('omiglpro-chat-details', JSON.stringify({
        name: chatName.value.trim(),
        gender: document.querySelector('input[name="gender"]:checked').value,
        country: countryInput.value,
        adultConfirmed: adultInput.checked
    }));
    window.location.href = './pages/chat.html';
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && chatModal.classList.contains('is-open')) {
        closeChatModal();
    }

    if (event.key === 'Tab' && chatModal.classList.contains('is-open')) {
        const focusable = chatDialog.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
        }
    }
});

document.addEventListener('pointerdown', (event) => {
    if (!countryMenu.hidden && !countryPicker.contains(event.target)) {
        closeCountryMenu();
    }
});
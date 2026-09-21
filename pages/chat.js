const storedDetails = sessionStorage.getItem('omiglpro-chat-details');
const userName = document.querySelector('#chat-user-name');
const profileButton = document.querySelector('.profile-button');
const profileDrawer = document.querySelector('#profile-drawer');
const profilePanel = profileDrawer?.querySelector('.profile-drawer__panel');
const profileView = document.querySelector('#profile-view');
const profileEditButton = document.querySelector('#profile-edit');
const profileSaveButton = document.querySelector('#profile-save');
const profileNameInput = document.querySelector('#profile-name-input');
const profileGenderInputs = document.querySelectorAll('input[name="profile-gender"]');
const profileCountryInput = document.querySelector('#profile-country-input');
const profileCountryPicker = document.querySelector('#profile-country-picker');
const profileCountryMenu = document.querySelector('#profile-country-menu');
const profileCountrySearch = document.querySelector('#profile-country-search');
const profileCountryList = document.querySelector('#profile-country-list');
const profileCountrySelected = profileCountryInput.querySelector('.profile-country-picker__selected');
const profileCountryEmpty = document.querySelector('.profile-country-picker__empty');
const profileViewName = document.querySelector('#profile-view-name');
const profileDetailName = document.querySelector('#profile-detail-name');
const profileDetailGender = document.querySelector('#profile-detail-gender');
const profileDetailCountry = document.querySelector('#profile-detail-country');
const profileAutoMessageSummary = document.querySelector('#profile-auto-message-summary');
const profileAutoMessageEnabled = document.querySelector('#profile-auto-message-enabled');
const profileAutoMessageInput = document.querySelector('#profile-auto-message-input');
const profileAutoMessageError = document.querySelector('#profile-auto-message-error');
const profileRequiredMessage = document.querySelector('#profile-required-message');
let profileDetails = {};
let isProfileEditing = false;
let profileRequiresSetup = false;
let profileReady = false;
let lastProfileFocus = null;

const countryOptions = [
	['United States', 'US'], ['Canada', 'CA'], ['United Kingdom', 'GB'], ['Australia', 'AU'],
	['Germany', 'DE'], ['France', 'FR'], ['Spain', 'ES'], ['Italy', 'IT'], ['Brazil', 'BR'],
	['Mexico', 'MX'], ['India', 'IN'], ['Japan', 'JP'], ['South Korea', 'KR'], ['Philippines', 'PH'],
	['Nigeria', 'NG'], ['South Africa', 'ZA'], ['Turkey', 'TR'], ['United Arab Emirates', 'AE'],
	['Sweden', 'SE'], ['Netherlands', 'NL']
];

const formatGender = (gender) => gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Not provided';
const isValidName = (name) => /^[A-Za-z]{1,7}$/.test(name.trim());
const normalizeAutoMessage = (value) => value.replace(/\s+/g, ' ').trim();
const countAutoMessageWords = (value) => value ? value.split(/\s+/).length : 0;
const containsBlockedWord = (value) => {
	const blockedWords = Array.isArray(window.omiglproBlockedWords) ? window.omiglproBlockedWords : [];
	const escapedWords = blockedWords
		.filter((word) => typeof word === 'string' && word.trim())
		.sort((first, second) => second.length - first.length)
		.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	if (!escapedWords.length) {
		return false;
	}
	return new RegExp(`(?:^|[^a-z0-9])(?:${escapedWords.join('|')})(?=$|[^a-z0-9])`, 'i').test(value);
};

const validateAutoMessage = (value) => {
	const normalizedMessage = normalizeAutoMessage(value);
	if (countAutoMessageWords(normalizedMessage) > 10) {
		return 'Keep your automatic message to 10 words or fewer.';
	}
	if (containsBlockedWord(normalizedMessage)) {
		return 'Please remove restricted language from your automatic message.';
	}
	return '';
};

const isCompleteProfile = (details) => Boolean(
	details
	&& typeof details.name === 'string'
	&& isValidName(details.name)
	&& (details.gender === 'male' || details.gender === 'female')
	&& typeof details.country === 'string'
	&& details.country.trim().length > 0
);

const populateCountries = () => {
	const query = profileCountrySearch.value.trim().toLowerCase();
	const visibleCountries = countryOptions.filter(([country]) => country.toLowerCase().includes(query));
	profileCountryList.innerHTML = visibleCountries.map(([country, code]) => `<li role="presentation"><button class="profile-country-option" type="button" role="option" data-country="${country}" data-code="${code}"><img src="../assets/images/icons/country-flag.svg" alt="" aria-hidden="true"><span>${country}</span></button></li>`).join('');
	profileCountryEmpty.hidden = visibleCountries.length > 0;
};

const closeCountryMenu = () => {
	profileCountryMenu.hidden = true;
	profileCountryInput.setAttribute('aria-expanded', 'false');
};

const setProfileCountry = (country) => {
	profileCountryInput.dataset.value = country;
	profileCountrySelected.innerHTML = `<span>${country}</span>`;
	closeCountryMenu();
	updateSaveButton();
};

const renderProfileDetails = () => {
	const name = profileDetails.name || 'Not provided';
	profileViewName.textContent = name;
	profileDetailName.textContent = name;
	profileDetailGender.textContent = formatGender(profileDetails.gender);
	profileDetailCountry.textContent = profileDetails.country || 'Not provided';
	profileAutoMessageSummary.textContent = profileDetails.autoMessageEnabled && profileDetails.autoMessage ? `On: ${profileDetails.autoMessage}` : 'Off';
	if (userName) {
		userName.textContent = profileDetails.name ? `, ${profileDetails.name}` : '';
	}
};

const enterProfileEdit = (requiresSetup = false) => {
	isProfileEditing = true;
	profileRequiresSetup = requiresSetup;
	profileNameInput.value = profileDetails.name || '';
	profileGenderInputs.forEach((input) => { input.checked = input.value === profileDetails.gender; });
	profileCountryInput.dataset.value = profileDetails.country || '';
	profileCountrySelected.innerHTML = profileDetails.country ? `<span>${profileDetails.country}</span>` : '<span class="profile-country-picker__placeholder">Choose your country</span>';
	profileAutoMessageEnabled.checked = Boolean(profileDetails.autoMessageEnabled);
	profileAutoMessageInput.value = profileDetails.autoMessage || '';
	profileAutoMessageError.hidden = true;
	profileView.classList.add('is-editing');
	profileView.classList.toggle('is-required', requiresSetup);
	profileRequiredMessage.hidden = !requiresSetup;
	profileRequiredMessage.textContent = 'Name must be 1 to 7 letters, with no numbers or symbols.';
	profileEditButton.hidden = true;
	profileSaveButton.hidden = !requiresSetup;
	profileSaveButton.disabled = true;
	profileNameInput.focus();
};

const getEditedDetails = () => ({
	...profileDetails,
	name: profileNameInput.value.trim(),
	gender: document.querySelector('input[name="profile-gender"]:checked')?.value || '',
	country: profileCountryInput.dataset.value || '',
	autoMessageEnabled: profileAutoMessageEnabled.checked,
	autoMessage: normalizeAutoMessage(profileAutoMessageInput.value)
});

const updateSaveButton = () => {
	if (!isProfileEditing) {
		return;
	}
	const nextDetails = getEditedDetails();
	const isValid = isCompleteProfile(nextDetails);
	const autoMessageError = validateAutoMessage(nextDetails.autoMessage);
	const hasChanges = JSON.stringify(nextDetails) !== JSON.stringify(profileDetails);
	profileAutoMessageError.textContent = autoMessageError;
	profileAutoMessageError.hidden = !autoMessageError;
	profileSaveButton.disabled = !isValid || Boolean(autoMessageError);
	profileSaveButton.hidden = profileRequiresSetup ? false : !isValid || !hasChanges;
};

const leaveProfileEdit = () => {
	isProfileEditing = false;
	profileRequiresSetup = false;
	profileView.classList.remove('is-editing');
	profileView.classList.remove('is-required');
	profileRequiredMessage.hidden = true;
	profileEditButton.hidden = false;
	profileSaveButton.hidden = true;
};

const closeProfile = () => {
	leaveProfileEdit();
	profileDrawer.classList.remove('is-open');
	profileDrawer.setAttribute('aria-hidden', 'true');
	profileButton.setAttribute('aria-expanded', 'false');
	document.body.classList.remove('profile-is-open');
	if (lastProfileFocus) {
		lastProfileFocus.focus();
	}
	if (!profileReady) {
		window.setTimeout(() => {
			openProfile();
			enterProfileEdit(true);
		}, 0);
	}
};

const openProfile = () => {
	lastProfileFocus = profileButton;
	profileDrawer.classList.add('is-open');
	profileDrawer.setAttribute('aria-hidden', 'false');
	profileButton.setAttribute('aria-expanded', 'true');
	document.body.classList.add('profile-is-open');
	profilePanel.focus();
};

if (storedDetails) {
	try {
		const parsedDetails = JSON.parse(storedDetails);
		profileDetails = parsedDetails && typeof parsedDetails === 'object' ? parsedDetails : {};
	} catch (error) {
		sessionStorage.removeItem('omiglpro-chat-details');
	}
}

profileReady = isCompleteProfile(profileDetails);

populateCountries();
renderProfileDetails();

profileButton.addEventListener('click', openProfile);
profileDrawer.querySelectorAll('[data-profile-close]').forEach((element) => {
	element.addEventListener('click', closeProfile);
});
profileEditButton.addEventListener('click', enterProfileEdit);


[profileNameInput, ...profileGenderInputs].forEach((input) => {
	input.addEventListener('input', updateSaveButton);
	input.addEventListener('change', updateSaveButton);
});

[profileAutoMessageEnabled, profileAutoMessageInput].forEach((input) => {
	input.addEventListener('input', updateSaveButton);
	input.addEventListener('change', updateSaveButton);
});

profileCountryInput.addEventListener('click', () => {
	const isOpen = !profileCountryMenu.hidden;
	profileCountryMenu.hidden = isOpen;
	profileCountryInput.setAttribute('aria-expanded', String(!isOpen));
	if (!isOpen) {
		profileCountrySearch.value = '';
		populateCountries();
		window.setTimeout(() => profileCountrySearch.focus(), 0);
	}
});
profileCountrySearch.addEventListener('input', populateCountries);
profileCountryList.addEventListener('click', (event) => {
	const option = event.target.closest('[data-country]');
	if (option) {
		setProfileCountry(option.dataset.country);
	}
});

profileSaveButton.addEventListener('click', () => {
	const nextDetails = getEditedDetails();
	if (!isCompleteProfile(nextDetails)) {
		profileNameInput.focus();
		return;
	}
	if (validateAutoMessage(nextDetails.autoMessage)) {
		updateSaveButton();
		profileAutoMessageInput.focus();
		return;
	}

	profileDetails = nextDetails;
	profileReady = true;
	sessionStorage.setItem('omiglpro-chat-details', JSON.stringify(profileDetails));

	renderProfileDetails();
	leaveProfileEdit();
	closeProfile();
	if (chatSocket && chatSocket.connected) {
		setWaitingState();
		chatSocket.emit('join-pool', profileDetails);
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && profileDrawer.classList.contains('is-open')) {
		closeProfile();
	}
});

if (!profileReady) {
	window.setTimeout(() => {
		openProfile();
		enterProfileEdit(true);
	}, 0);
}

const chatSocket = typeof window.io === 'function' ? window.io() : null;
const chatShell = document.querySelector('.chat-shell');
const chatTitle = document.querySelector('#chat-title');
const chatConnectionCard = document.querySelector('#chat-connection-card');
const chatEmptyState = document.querySelector('#chat-empty-state');
const matchedGenderIcon = document.querySelector('#matched-gender-icon');
const matchedName = document.querySelector('#matched-name');
const matchedCountry = document.querySelector('#matched-country');
const matchedCountryFlag = document.querySelector('#matched-country-flag');
const chatNextButton = document.querySelector('#chat-next');
const chatMessages = document.querySelector('#chat-messages');
const chatMessageInput = document.querySelector('#chat-message-input');
const chatSendButton = document.querySelector('#chat-send');
const matchedProfileMedia = document.querySelector('#matched-profile-media');
const matchedTypingVideo = document.querySelector('#matched-typing-video');
let isMatched = false;
let isTyping = false;
let stopTypingTimer = null;
let matchedPartner = null;
let autoMessageSent = false;

const resetTypingState = () => {
	isTyping = false;
	window.clearTimeout(stopTypingTimer);
	stopTypingTimer = null;
	hideTypingVideo();
};

const updateMobileViewport = () => {
	if (window.innerWidth <= 600) {
		const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
		document.documentElement.style.setProperty('--chat-viewport-height', `${viewportHeight}px`);
	}
};

updateMobileViewport();
window.addEventListener('resize', updateMobileViewport, { passive: true });
window.visualViewport?.addEventListener('resize', updateMobileViewport, { passive: true });

const setWaitingState = (isOffline = false) => {
	isMatched = false;
	matchedPartner = null;
	autoMessageSent = false;
	resetTypingState();
	chatShell.classList.remove('is-connected');
	chatConnectionCard.classList.remove('is-connected');
	chatEmptyState.classList.toggle('is-offline', isOffline);
	chatNextButton.hidden = true;
	matchedGenderIcon.removeAttribute('src');
	matchedName.textContent = '';
	matchedCountry.textContent = '';
	matchedCountryFlag.textContent = '';
	chatTitle.textContent = 'A new conversation is waiting.';
	chatMessageInput.disabled = true;
	chatSendButton.disabled = true;
	chatMessages.replaceChildren();
};

const addMessage = (message, isSelf = false, senderName = '') => {
	const messageElement = document.createElement('div');
	messageElement.className = `chat-message${isSelf ? ' chat-message--self' : ''}`;
	const avatar = document.createElement('img');
	avatar.className = 'chat-message__avatar';
	avatar.src = `../assets/images/icons/${isSelf && profileDetails.gender === 'female' ? 'female' : !isSelf && matchedPartner?.gender === 'female' ? 'female' : 'male'}.svg`;
	avatar.alt = '';
	avatar.setAttribute('aria-hidden', 'true');

	const content = document.createElement('div');
	content.className = 'chat-message__content';
	const sender = document.createElement('span');
	sender.className = 'chat-message__sender';
	sender.textContent = isSelf ? (profileDetails.name || 'You') : (senderName || matchedPartner?.name || 'User');
	const text = document.createElement('span');
	text.className = 'chat-message__text';
	text.textContent = message;
	content.append(sender, text);
	messageElement.append(avatar, content);
	chatMessages.append(messageElement);
	chatMessages.scrollTop = chatMessages.scrollHeight;
};

const setMatchedState = (partner) => {
	isMatched = true;
	matchedPartner = partner;
	resetTypingState();
	chatShell.classList.add('is-connected');
	chatConnectionCard.classList.add('is-connected');
	chatNextButton.hidden = false;
	chatTitle.textContent = `Connected with ${partner.name}`;
	matchedName.textContent = partner.name;
	matchedCountry.textContent = partner.country;
	matchedCountryFlag.textContent = countryFlag(partner.country);
	matchedGenderIcon.src = `../assets/images/icons/${partner.gender === 'female' ? 'female' : 'male'}.svg`;
	matchedGenderIcon.alt = `${formatGender(partner.gender)} profile`;
	chatMessageInput.disabled = false;
	chatSendButton.disabled = false;
	chatMessageInput.focus();
	if (!autoMessageSent && profileDetails.autoMessageEnabled && profileDetails.autoMessage) {
		autoMessageSent = true;
		chatSocket.emit('message', profileDetails.autoMessage);
		addMessage(profileDetails.autoMessage, true);
	}
};

const showTypingVideo = (gender) => {
	const videoPath = `../assets/images/videos/${gender === 'female' ? 'girl' : 'boy'}_bitimoji.webm`;
	if (matchedTypingVideo.getAttribute('src') !== videoPath) {
		matchedTypingVideo.src = videoPath;
		matchedTypingVideo.load();
	}
	matchedProfileMedia.classList.add('is-typing');
	const playTypingVideo = () => matchedTypingVideo.play().catch(() => {});
	if (matchedTypingVideo.readyState >= 2) {
		playTypingVideo();
	} else {
		matchedTypingVideo.addEventListener('canplay', playTypingVideo, { once: true });
	}
};

const hideTypingVideo = () => {
	matchedProfileMedia.classList.remove('is-typing');
	matchedTypingVideo.pause();
	matchedTypingVideo.currentTime = 0;
};

const countryFlag = (country) => {
	const countryCodes = {
		'United States': 'US', Canada: 'CA', 'United Kingdom': 'GB', Australia: 'AU', Germany: 'DE',
		France: 'FR', Spain: 'ES', Italy: 'IT', Brazil: 'BR', Mexico: 'MX', India: 'IN', Japan: 'JP',
		'South Korea': 'KR', Philippines: 'PH', Nigeria: 'NG', 'South Africa': 'ZA', Turkey: 'TR',
		'United Arab Emirates': 'AE', Sweden: 'SE', Netherlands: 'NL'
	};
	const code = countryCodes[country];
	return code ? String.fromCodePoint(...code.split('').map((letter) => 127397 + letter.charCodeAt(0))) : '';
};

const sanitizeMessage = (value) => {
	const blockedWords = Array.isArray(window.omiglproBlockedWords) ? window.omiglproBlockedWords : [];
	const escapedWords = blockedWords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	const blockedWordPattern = escapedWords.length ? new RegExp(`\\b(?:${escapedWords.join('|')})\\b`, 'gi') : null;
	let sanitizedMessage = value.replace(/(?<!\d)\d{10}(?!\d)/g, '');
	if (blockedWordPattern) {
		sanitizedMessage = sanitizedMessage.replace(blockedWordPattern, '');
	}
	return sanitizedMessage.replace(/\s+/g, ' ').trim();
};

const sendMessage = () => {
	const message = sanitizeMessage(chatMessageInput.value);
	chatMessageInput.value = message;
	if (!chatSocket || !isMatched || !message) {
		return;
	}
	chatSocket.emit('message', message);
	addMessage(message, true);
	chatMessageInput.value = '';
};

const notifyTyping = () => {
	if (!chatSocket || !isMatched) {
		return;
	}

	if (!isTyping) {
		isTyping = true;
		chatSocket.emit('typing');
	}

	window.clearTimeout(stopTypingTimer);
	stopTypingTimer = window.setTimeout(() => {
		isTyping = false;
		chatSocket.emit('stop-typing');
	}, 1500);
};

document.addEventListener('keydown', (event) => {
	if (window.innerWidth <= 600 || !isMatched || profileDrawer.classList.contains('is-open')) {
		return;
	}

	const activeElement = document.activeElement;
	const isEditingField = activeElement instanceof HTMLInputElement
		|| activeElement instanceof HTMLTextAreaElement
		|| activeElement instanceof HTMLSelectElement
		|| activeElement?.isContentEditable;
	if (isEditingField || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
		return;
	}

	chatMessageInput.focus();
	chatMessageInput.setRangeText(event.key, chatMessageInput.selectionStart, chatMessageInput.selectionEnd, 'end');
	chatMessageInput.dispatchEvent(new Event('input', { bubbles: true }));
});

chatMessages.addEventListener('mouseenter', () => {
	if (window.innerWidth > 600 && isMatched) {
		chatMessages.focus({ preventScroll: true });
	}
});

chatMessages.addEventListener('keydown', (event) => {
	const scrollAmount = Math.max(80, chatMessages.clientHeight * 0.7);
	if (event.key === 'ArrowDown' || event.key === 'PageDown') {
		event.preventDefault();
		chatMessages.scrollBy({ top: scrollAmount, behavior: 'smooth' });
	} else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
		event.preventDefault();
		chatMessages.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
	}
});

if (chatSocket) {
	chatSocket.on('connect', () => {
		if (profileReady) {
			chatSocket.emit('join-pool', profileDetails);
		}
	});

	chatSocket.on('waiting', setWaitingState);
	chatSocket.on('matched', setMatchedState);
	chatSocket.on('partner-left', setWaitingState);
	chatSocket.on('disconnect', () => {
		if (isMatched) {
			setWaitingState(true);
		}
	});
	chatSocket.on('typing', (typingUser) => showTypingVideo(typingUser.gender));
	chatSocket.on('stop-typing', hideTypingVideo);
	chatSocket.on('message', (message) => addMessage(message.text, false, message.sender));
}

window.addEventListener('offline', () => {
	if (isMatched) {
		setWaitingState(true);
	}
});

chatNextButton.addEventListener('click', () => {
	if (chatSocket && isMatched) {
		setWaitingState();
		chatSocket.emit('next');
	}
});

document.addEventListener('keydown', (event) => {
	if (window.innerWidth <= 600 || event.key !== 'ArrowRight' || !isMatched || profileDrawer.classList.contains('is-open')) {
		return;
	}

	const activeElement = document.activeElement;
	const isEditingField = activeElement instanceof HTMLInputElement
		|| activeElement instanceof HTMLTextAreaElement
		|| activeElement instanceof HTMLSelectElement
		|| activeElement?.isContentEditable;
	if (isEditingField) {
		return;
	}

	event.preventDefault();
	chatNextButton.click();
});

chatSendButton.addEventListener('click', sendMessage);
chatMessageInput.addEventListener('input', notifyTyping);
chatMessageInput.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') {
		event.preventDefault();
		sendMessage();
	}
});

const storedDetails = sessionStorage.getItem('omiglpro-chat-details');
const userName = document.querySelector('#chat-user-name');
const profileButton = document.querySelector('.profile-button');
const profileDrawer = document.querySelector('#profile-drawer');
const profilePanel = profileDrawer?.querySelector('.profile-drawer__panel');
const profileView = document.querySelector('#profile-view');
const profileEditButton = document.querySelector('#profile-edit');
const profileSaveButton = document.querySelector('#profile-save');
const profileNameInput = document.querySelector('#profile-name-input');
const profileGenderInput = document.querySelector('#profile-gender-input');
const profileCountryInput = document.querySelector('#profile-country-input');
const profileViewName = document.querySelector('#profile-view-name');
const profileDetailName = document.querySelector('#profile-detail-name');
const profileDetailGender = document.querySelector('#profile-detail-gender');
const profileDetailCountry = document.querySelector('#profile-detail-country');
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

const isCompleteProfile = (details) => Boolean(
	details
	&& typeof details.name === 'string'
	&& details.name.trim().length >= 2
	&& (details.gender === 'male' || details.gender === 'female')
	&& typeof details.country === 'string'
	&& details.country.trim().length > 0
);

const populateCountries = () => {
	profileCountryInput.innerHTML = '<option value="">Choose a country</option>' + countryOptions.map(([country]) => `<option value="${country}">${country}</option>`).join('');
};

const renderProfileDetails = () => {
	const name = profileDetails.name || 'Not provided';
	profileViewName.textContent = name;
	profileDetailName.textContent = name;
	profileDetailGender.textContent = formatGender(profileDetails.gender);
	profileDetailCountry.textContent = profileDetails.country || 'Not provided';
	if (userName) {
		userName.textContent = profileDetails.name ? `, ${profileDetails.name}` : '';
	}
};

const enterProfileEdit = (requiresSetup = false) => {
	isProfileEditing = true;
	profileRequiresSetup = requiresSetup;
	profileNameInput.value = profileDetails.name || '';
	profileGenderInput.value = profileDetails.gender || '';
	profileCountryInput.value = profileDetails.country || '';
	profileView.classList.add('is-editing');
	profileView.classList.toggle('is-required', requiresSetup);
	profileRequiredMessage.hidden = !requiresSetup;
	profileEditButton.hidden = true;
	profileSaveButton.hidden = !requiresSetup;
	profileSaveButton.disabled = true;
	profileNameInput.focus();
};

const getEditedDetails = () => ({
	...profileDetails,
	name: profileNameInput.value.trim(),
	gender: profileGenderInput.value,
	country: profileCountryInput.value
});

const updateSaveButton = () => {
	if (!isProfileEditing) {
		return;
	}
	const nextDetails = getEditedDetails();
	const isValid = isCompleteProfile(nextDetails);
	const hasChanges = JSON.stringify(nextDetails) !== JSON.stringify(profileDetails);
	profileSaveButton.disabled = !isValid;
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

[profileNameInput, profileGenderInput, profileCountryInput].forEach((input) => {
	input.addEventListener('input', updateSaveButton);
	input.addEventListener('change', updateSaveButton);
});

profileSaveButton.addEventListener('click', () => {
	const nextDetails = getEditedDetails();
	if (!isCompleteProfile(nextDetails)) {
		profileNameInput.focus();
		return;
	}

	profileDetails = nextDetails;
	profileReady = true;
	sessionStorage.setItem('omiglpro-chat-details', JSON.stringify(profileDetails));

	renderProfileDetails();
	leaveProfileEdit();
	if (chatSocket && chatSocket.connected) {
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

const setWaitingState = () => {
	isMatched = false;
	resetTypingState();
	chatShell.classList.remove('is-connected');
	chatConnectionCard.classList.remove('is-connected');
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

const addMessage = (message, isSelf = false) => {
	const messageElement = document.createElement('div');
	messageElement.className = `chat-message${isSelf ? ' chat-message--self' : ''}`;
	messageElement.textContent = message;
	chatMessages.append(messageElement);
	chatMessages.scrollTop = chatMessages.scrollHeight;
};

const setMatchedState = (partner) => {
	isMatched = true;
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
};

const showTypingVideo = (gender) => {
    console.log('Typing event received for gender:', gender); // TEMP DEBUG
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

const sendMessage = () => {
	const message = chatMessageInput.value.trim();
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
	}, 650);
};

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
	chatSocket.on('typing', (typingUser) => showTypingVideo(typingUser.gender));
	chatSocket.on('stop-typing', hideTypingVideo);
	chatSocket.on('message', (message) => addMessage(`${message.sender}: ${message.text}`));
}

chatNextButton.addEventListener('click', () => {
	if (chatSocket && isMatched) {
		setWaitingState();
		chatSocket.emit('next');
	}
});

chatSendButton.addEventListener('click', sendMessage);
chatMessageInput.addEventListener('input', notifyTyping);
chatMessageInput.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') {
		event.preventDefault();
		sendMessage();
	}
});

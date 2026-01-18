let auth0Client = null;

const configureClient = async () => {
	auth0Client = await auth0.createAuth0Client({
		domain: "dev-u7efbjm5pniwfqug.us.auth0.com", 
		clientId: "wzRVsqaKJ4FcWNNU5vCVM1hYCcNIsdqF"
	});
};

const CONFIG = {
	KEY: "AIzaSyBKnv_X66gcmshT1r82EAAUntUHA2YZwwc",
	MODEL: "gemini-2.5-flash" 
};

const micBtn = document.getElementById('mic-btn');
const stopBtn = document.getElementById('stop-btn');
const output = document.getElementById('output-text');
const status = document.getElementById('status-tag');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
const synth = window.speechSynthesis;

const initApp = () => {
	micBtn.onclick = () => {
		try {
			recognition.start();
			status.innerText = "LISTENING";
			micBtn.classList.add('listening');
		} catch (e) { console.log("Recognition already active"); }
	};

	recognition.onresult = async (event) => {
		const transcript = event.results[0][0].transcript;
		output.innerHTML = `<strong>YOU:</strong> ${transcript}`;
		await getGeminiResponse(transcript);
	};

	recognition.onend = () => { micBtn.classList.remove('listening'); };

	stopBtn.onclick = () => {
		synth.cancel();
		status.innerText = "MUTED";
	};
};

async function getGeminiResponse(query) {
	status.innerText = "THINKING";
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL}:generateContent?key=${CONFIG.KEY}`;
	const payload = {
		contents: [{
			parts: [{ text: `You are Reginald, a helpful kitchen butler. Provide a very concise, direct cooking answer for a chef: ${query}` }]
		}]
	};

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await response.json();
		const aiText = data.candidates[0].content.parts[0].text;
		displayAndSpeak(aiText);
	} catch (error) {
		output.innerText = "Connection Error.";
		status.innerText = "ERROR";
	}
}

function displayAndSpeak(text) {
	status.innerText = "SPEAKING";
	output.innerHTML += `<br><br><strong>REGINALD:</strong> ${text}`;
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.rate = 1.0;
	utterance.pitch = 0.8; 
	synth.cancel(); 
	synth.speak(utterance);
	utterance.onend = () => { status.innerText = "READY"; };
}

window.onload = async () => {
	await configureClient();

	const query = window.location.search;
	if (query.includes("code=") && query.includes("state=")) {
		await auth0Client.handleRedirectCallback();
		window.history.replaceState({}, document.title, "/");
	}

	const isAuthenticated = await auth0Client.isAuthenticated();

	if (isAuthenticated) {
		document.getElementById("auth-overlay").style.display = "none";
		document.getElementById("kitchen-box").style.display = "block";
		initApp();
	} else {
		document.getElementById("auth-overlay").style.display = "flex";
		document.getElementById("kitchen-box").style.display = "none";
	}

	document.getElementById("btn-login").onclick = async () => {
		await auth0Client.loginWithRedirect({
			authorizationParams: { redirect_uri: window.location.origin }
		});
	};

	document.getElementById("btn-logout").onclick = () => {
		auth0Client.logout({
			logoutParams: { returnTo: window.location.origin }
		});
	};
};
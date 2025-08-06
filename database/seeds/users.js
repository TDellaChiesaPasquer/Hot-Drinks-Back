// Traduction JS (Node.js) fidèle au code Ruby, sans modification de logique.

"use strict";
const fs = require("fs");
const crypto = require("crypto");

// --- Données sources
const MALE_NAMES = [
	"Adrien",
	"Alexandre",
	"Alexis",
	"Amaury",
	"André",
	"Antoine",
	"Arnaud",
	"Arthur",
	"Aurélien",
	"Bastien",
	"Benjamin",
	"Benoît",
	"Bernard",
	"Bertrand",
	"Brice",
	"Bruno",
	"Camille",
	"Cédric",
	"Charles",
	"Christian",
	"Christophe",
	"Claude",
	"Clément",
	"Damien",
	"Daniel",
	"David",
	"Denis",
	"Didier",
	"Dimitri",
	"Dominique",
	"Édouard",
	"Emmanuel",
	"Éric",
	"Étienne",
	"Fabien",
	"Fabrice",
	"Florian",
	"Frédéric",
	"Gaël",
	"Gaspard",
	"Gautier",
	"Grégoire",
	"Guillaume",
	"Hugo",
	"Hugues",
	"Jacques",
	"Jean",
	"Jérôme",
	"Jonathan",
	"Joseph",
	"Julien",
	"Kevin",
	"Laurent",
	"Léo",
	"Léon",
	"Loïc",
	"Louis",
	"Lucas",
	"Marc",
	"Marcel",
	"Martin",
	"Mathieu",
	"Matthieu",
	"Maxime",
	"Michel",
	"Nicolas",
	"Olivier",
	"Pascal",
	"Patrick",
	"Paul",
	"Philippe",
	"Pierre",
	"Quentin",
	"Raphaël",
	"Rémi",
	"Renaud",
	"René",
	"Richard",
	"Robin",
	"Romain",
	"Samuel",
	"Sébastien",
	"Simon",
	"Stéphane",
	"Sylvain",
	"Théo",
	"Thierry",
	"Thomas",
	"Timothée",
	"Tony",
	"Tristan",
	"Victor",
	"Vincent",
	"Xavier",
	"Yann",
	"Yohann",
	"Yves",
	"Zacharie",
];

const FEMALE_NAMES = [
	"Adrienne",
	"Agnès",
	"Alexandra",
	"Alice",
	"Amandine",
	"Amélie",
	"Anaïs",
	"Angélique",
	"Anne",
	"Annick",
	"Antoinette",
	"Audrey",
	"Aurélie",
	"Axelle",
	"Béatrice",
	"Camille",
	"Carine",
	"Caroline",
	"Catherine",
	"Cécile",
	"Céline",
	"Chantal",
	"Charlotte",
	"Christine",
	"Claire",
	"Clara",
	"Claudine",
	"Colette",
	"Constance",
	"Cora",
	"Coralie",
	"Delphine",
	"Diane",
	"Éléonore",
	"Élisabeth",
	"Élodie",
	"Émilie",
	"Estelle",
	"Eugénie",
	"Eva",
	"Évelyne",
	"Fabienne",
	"Faustine",
	"Florence",
	"Françoise",
	"Gabrielle",
	"Geneviève",
	"Hélène",
	"Honorine",
	"Inès",
	"Ingrid",
	"Irène",
	"Isabelle",
	"Jacqueline",
	"Jade",
	"Jeanne",
	"Jeannine",
	"Jennifer",
	"Jessica",
	"Julie",
	"Juliette",
	"Karine",
	"Laetitia",
	"Laurence",
	"Léa",
	"Léonie",
	"Liliane",
	"Lise",
	"Lorraine",
	"Louise",
	"Lucie",
	"Madeleine",
	"Manon",
	"Margaux",
	"Marguerite",
	"Marie",
	"Marine",
	"Marion",
	"Martine",
	"Mathilde",
	"Mélanie",
	"Micheline",
	"Mireille",
	"Monique",
	"Nadine",
	"Nathalie",
	"Nicole",
	"Noémie",
	"Océane",
	"Patricia",
	"Pauline",
	"Perrine",
	"Philippine",
	"Rachel",
	"Renée",
	"Roxane",
	"Sabine",
	"Sandrine",
	"Sarah",
	"Sophie",
	"Stéphanie",
	"Suzanne",
	"Sylvie",
	"Thérèse",
	"Valérie",
	"Véronique",
	"Victoria",
	"Virginie",
	"Yolande",
	"Yvonne",
	"Zoé",
];

const ALL_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];

const RELATION_OPTIONS = ["chocolat chaud", "allongé", "thé", "expresso", "ristretto", "matcha"];

const INTERESTS_POOL = [
	"cinéma",
	"musique",
	"sport",
	"lecture",
	"voyage",
	"cuisine",
	"danse",
	"photographie",
	"randonnée",
	"peinture",
	"jardinage",
	"natation",
	"yoga",
	"bricolage",
	"écriture",
	"théâtre",
	"vélo",
	"voile",
	"dessin",
	"pêche",
	"camping",
	"jeux_vidéo",
	"couture",
	"tricot",
	"méditation",
	"pilates",
	"astronomie",
	"podcasts",
	"séries",
	"mode",
	"animaux",
	"bénévolat",
	"technologie",
	"voitures",
];

// --- Utilitaires
function randInt(min, maxInclusive) {
	return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

function randomAlphanumeric(len) {
	const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
	let out = "";
	// crypto pour une meilleure entropie
	const buf = crypto.randomBytes(len);
	for (let i = 0; i < len; i++) {
		out += alphabet[buf[i] % alphabet.length];
	}
	return out;
}

function randomEmail() {
	return `${randomAlphanumeric(4)}@${randomAlphanumeric(4)}.${randomAlphanumeric(4)}`;
}

function randomPhone() {
	return `+33${randInt(600000000, 699999999)}`;
}

function sampleN(array, n) {
	const copy = array.slice();
	// shuffle partiel (Fisher–Yates)
	for (let i = copy.length - 1; i > 0; i--) {
		const j = randInt(0, i);
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy.slice(0, n);
}

function randomMonthShift(date, monthsBack) {
	const d = new Date(date.getTime());
	d.setMonth(d.getMonth() - monthsBack);
	return d;
}

function addDays(date, days) {
	const d = new Date(date.getTime());
	d.setDate(d.getDate() + days);
	return d;
}

function formatDateYYYYMMDD(date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

// --- Fonctions "métier" traduites
function generateUsers(n) {
	return sampleN(ALL_NAMES, n).map((name) => {
		const ageYears = 18 + randInt(0, 12); // 18..30
		const base = randomMonthShift(new Date(), ageYears * 12);
		const birthDate = addDays(base, randInt(0, 364));

		const tastes = sampleN(INTERESTS_POOL, 5);
		const ageRange = `18-${18 + randInt(0, 11)}`; // "18-18..29"

		const latitude = 48.8 + Number(Math.random().toFixed(3)); // 48.8..49.8
		const longitude = 2.3 + Number(Math.random().toFixed(3)); // 2.3..3.3

		return {
			username: name,
			birthdate: birthDate, // converti lors de l’écriture/affichage
			gender: sampleN(["Homme", "Femme", "Tous"], 1)[0],
			orientation: sampleN(["Homme", "Femme", "Tous"], 1)[0],
			account_type: sampleN(["SMS", "Google"], 1)[0],
			email: randomEmail(),
			phone_number: randomPhone(),
			photo_list: [],
			likes_list: [],
			dislikes_list: [],
			superlikes_list: [],
			tastes_list: tastes,
			relationship: sampleN(RELATION_OPTIONS, 1)[0],
			age_range: ageRange,
			distance: randInt(1, 30),
			disable_account: false,
			premium_account: sampleN([true, false], 1)[0],
			latitude,
			longitude,
			blocklist: [],
			conversation_list: [],
			rdv_list: [],
		};
	});
}

function displayList(users) {
	users.forEach((u, i) => {
		console.log(`Profil ${i + 1}:`);
		Object.entries(u).forEach(([k, v]) => {
			let formatted;
			if (v instanceof Date) {
				formatted = formatDateYYYYMMDD(v);
			} else if (Array.isArray(v)) {
				formatted = `[${v.map((x) => JSON.stringify(x)).join(", ")}]`;
			} else {
				formatted = JSON.stringify(v);
			}
			console.log(`  - ${k}: ${formatted}`);
		});
		console.log();
	});
}

function writeJson(users, path) {
	try {
		const arr = users.map((u) => {
			const out = { ...u };
			out.birthdate = formatDateYYYYMMDD(u.birthdate);
			return out;
		});
		fs.writeFileSync(path, JSON.stringify(arr, null, 2), "utf8");
		return true;
	} catch {
		return false;
	}
}

// --- main
function main() {
	const users = generateUsers(15);
	displayList(users);
	if (writeJson(users, "users.json")) {
		console.log("Succès : users.json créé");
	} else {
		console.log("Échec : impossible de créer users.json");
	}
}

if (require.main === module) {
	main();
}

/**
 * Tests pour les routes de profils
 * Ce fichier contient les tests pour les routes de l'API liées aux profils utilisateurs.
 * Il teste les cas d'erreur et les validations sans nécessiter de données valides.
 */
const request = require("supertest");
const app = require("../app");

describe("Tests des routes de profils", () => {
	/**
	 * ======================================================
	 * TESTS POUR LA ROUTE GET /profils/profil
	 * ======================================================
	 */

	/**
	 * Test de GET /profils/profil sans token d'authentification
	 * Vérifie que la route rejette l'accès si aucun token n'est fourni
	 * et retourne le message d'erreur approprié
	 */
	it("GET /profils/profil sans token devrait retourner une erreur", async () => {
		const res = await request(app).get("/profils/profil");

		expect(res.body.result).toBe(false);
		expect(res.body.error).toBe("Please login.");
	});

	/**
	 * Test de GET /profils/profil avec un token invalide
	 * Vérifie que la route rejette l'accès si le token fourni n'est pas valide
	 * et retourne le message d'erreur approprié
	 */
	it("GET /profils/profil avec un token invalide devrait retourner une erreur", async () => {
		const res = await request(app).get("/profils/profil").set("authorization", "token_invalide");

		expect(res.body.result).toBe(false);
		expect(res.body.error).toBe("Your session is invalid. Please login again.");
	});

	/**
	 * ======================================================
	 * TESTS POUR LA ROUTE PUT /profils/swipe
	 * ======================================================
	 */

	/**
	 * Test de PUT /profils/swipe avec un body vide
	 * Vérifie que la route rejette la requête si aucun paramètre n'est fourni
	 */
	it("PUT /profils/swipe sans body devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({});

		expect(res.body.result).toBe(false);
	});

	/**
	 * Test de PUT /profils/swipe sans le paramètre 'action'
	 * Vérifie que la route rejette la requête si l'action n'est pas spécifiée
	 */
	it("PUT /profils/swipe sans action devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({
			userId: "507f1f77bcf86cd799439011",
		});

		expect(res.body.result).toBe(false);
	});

	/**
	 * Test de PUT /profils/swipe sans le paramètre 'userId'
	 * Vérifie que la route rejette la requête si l'identifiant de l'utilisateur n'est pas spécifié
	 */
	it("PUT /profils/swipe sans userId devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({
			action: "like",
		});

		expect(res.body.result).toBe(false);
	});

	/**
	 * Test de PUT /profils/swipe avec un format d'userId invalide
	 * Vérifie que la route rejette la requête si l'identifiant n'est pas au format MongoDB
	 */
	it("PUT /profils/swipe avec un userId au format invalide devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({
			action: "like",
			userId: "format_invalide",
		});

		expect(res.body.result).toBe(false);
	});

	/**
	 * Test de PUT /profils/swipe avec une action non reconnue
	 * Vérifie que la route rejette la requête si l'action n'est pas 'like', 'dislike' ou 'superlike'
	 */
	it("PUT /profils/swipe avec une action non reconnue devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({
			action: "action_non_reconnue",
			userId: "507f1f77bcf86cd799439011",
		});

		expect(res.body.result).toBe(false);
	});

	/**
	 * Test de PUT /profils/swipe avec un userId valide mais inexistant
	 * Vérifie que la route rejette la requête si l'utilisateur n'existe pas dans la base de données
	 */
	it("PUT /profils/swipe avec un userId valide mais inexistant devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({
			action: "like",
			userId: "507f1f77bcf86cd799439011", // ID valide au format MongoDB mais inexistant
		});

		expect(res.body.result).toBe(false);
	});

	/**
	 * Test de PUT /profils/swipe sans token d'authentification
	 * Vérifie que la route rejette la requête si l'utilisateur n'est pas authentifié
	 */
	it("PUT /profils/swipe sans token d'authentification devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({
			action: "like",
			userId: "507f1f77bcf86cd799439011",
		});

		expect(res.body.result).toBe(false);
	});
});

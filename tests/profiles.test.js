/**
 * Tests des routes de l'API liées à l'affichage des profils pour le composant de Swipe et sa réponse (Like, Dislike, Superlike)
 * Ici, on en teste que les cas de figure où aucun token n'est nécessaire pour les tests (cas false uniquement)
 */
const request = require("supertest");
const app = require("../app");

describe("Tests des routes de profils", () => {
	/**
	 * TESTS POUR LA ROUTE GET /profils/profil
	 */

	/**
	 * Vérifie le rejet d'accès sans token d'authentification.
	 */
	it("GET /profils/profil sans token devrait retourner une erreur", async () => {
		const res = await request(app).get("/profils/profil");

		expect(res.body.result).toBe(false);
		expect(res.body.error).toBe("Please login.");
	});

	/**
	 * Vérifie le rejet d'accès avec un token invalide.
	 */
	it("GET /profils/profil avec un token invalide devrait retourner une erreur", async () => {
		const res = await request(app).get("/profils/profil").set("authorization", "token_invalide");

		expect(res.body.result).toBe(false);
		expect(res.body.error).toBe("Your session is invalid. Please login again.");
	});

	/**
	 * TESTS POUR LA ROUTE PUT /profils/swipe
	 */

	/**
	 * Vérifie le rejet de la requête sans body.
	 */
	it("PUT /profils/swipe sans body devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({});

		expect(res.body.result).toBe(false);
	});

	/**
	 * Vérifie le rejet sans le paramètre 'userId'.
	 */
	it("PUT /profils/swipe sans userId devrait être rejeté", async () => {
		const res = await request(app).put("/profils/swipe").send({
			action: "like",
		});

		expect(res.body.result).toBe(false);
	});
});

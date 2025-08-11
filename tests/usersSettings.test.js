const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcrypt");
const User = require("../models/User"); // Ajustez le chemin selon votre structure
const app = require("../app"); // Votre fichier app Express principal

// Configuration globale des tests
describe("User Account API Routes", function () {
	let testUser;
	let authToken;
	const testPassword = "Password123!";
	const testEmail = "test@example.com";
	const updatedEmail = "updated@example.com";
	const salt = 10; // Doit correspondre à la valeur utilisée dans votre API

	// Avant tous les tests, créer un utilisateur de test et obtenir un token
	beforeAll(function (done) {
		// Connexion à la base de données de test
		mongoose
			.connect(process.env.MONGODB_URI_TEST, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then(function () {
				// Nettoyer toute donnée résiduelle de tests précédents
				return User.deleteMany({ email: { $in: [testEmail, updatedEmail] } });
			})
			.then(function () {
				// Créer un utilisateur de test
				return bcrypt.hash(testPassword, salt);
			})
			.then(function (hashedPassword) {
				testUser = new User({
					email: testEmail,
					password: hashedPassword,
					// Ajoutez d'autres champs requis par votre modèle User
				});
				return testUser.save();
			})
			.then(function () {
				// Obtenir un token d'authentification
				return request(app).post("/login").send({
					email: testEmail,
					password: testPassword,
				});
			})
			.then(function (loginResponse) {
				authToken = loginResponse.body.token;
				done();
			})
			.catch(function (error) {
				done(error);
			});
	});

	// Après tous les tests, nettoyer la base de données
	afterAll(function (done) {
		User.deleteMany({ email: { $in: [testEmail, updatedEmail] } })
			.then(function () {
				return mongoose.connection.close();
			})
			.then(function () {
				done();
			})
			.catch(function (error) {
				done(error);
			});
	});

	// Tests pour la route de modification du mot de passe
	describe("PUT /password", function () {
		const newPassword = "NewPassword456!";

		it("should change password with valid credentials", function (done) {
			request(app)
				.put("/password")
				.set("Authorization", authToken)
				.send({
					currentPassword: testPassword,
					password: newPassword,
				})
				.then(function (response) {
					expect(response.status).toBe(200);
					expect(response.body.result).toBe(true);

					// Vérifier que le mot de passe a bien été changé en essayant de se connecter avec
					return request(app).post("/login").send({
						email: testEmail,
						password: newPassword,
					});
				})
				.then(function (loginResponse) {
					expect(loginResponse.status).toBe(200);
					expect(loginResponse.body.token).toBeTruthy();

					// Mettre à jour le token pour les tests suivants
					authToken = loginResponse.body.token;
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});

		it("should reject with incorrect current password", function (done) {
			request(app)
				.put("/password")
				.set("Authorization", authToken)
				.send({
					currentPassword: "WrongPassword",
					password: "AnotherPassword789!",
				})
				.then(function (response) {
					expect(response.status).toBe(400);
					expect(response.body.result).toBe(false);
					expect(response.body.error).toBe("Current password is incorrect");
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});

		it("should reject when new password is same as current", function (done) {
			request(app)
				.put("/password")
				.set("Authorization", authToken)
				.send({
					currentPassword: newPassword,
					password: newPassword,
				})
				.then(function (response) {
					expect(response.status).toBe(400);
					expect(response.body.result).toBe(false);
					expect(response.body.error).toBe("New password must be different from current password");
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});

		it("should reject when password is too short", function (done) {
			request(app)
				.put("/password")
				.set("Authorization", authToken)
				.send({
					currentPassword: newPassword,
					password: "short",
				})
				.then(function (response) {
					expect(response.status).toBe(400);
					expect(response.body.result).toBe(false);
					expect(response.body.errors).toBeTruthy();
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});

		it("should reject when no token provided", function (done) {
			request(app)
				.put("/password")
				.send({
					currentPassword: newPassword,
					password: "ValidPassword123!",
				})
				.then(function (response) {
					expect(response.status).toBe(401);
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});
	});

	// Tests pour la route de modification de l'email
	describe("PUT /email", function () {
		it("should change email with valid data", function (done) {
			let responseObj;

			request(app)
				.put("/email")
				.set("Authorization", authToken)
				.send({
					email: updatedEmail,
				})
				.then(function (response) {
					responseObj = response;
					expect(response.status).toBe(200);
					expect(response.body.result).toBe(true);

					// Vérifier que l'email a bien été changé en base
					return User.findById(testUser._id);
				})
				.then(function (user) {
					expect(user.email).toBe(updatedEmail);
					expect(user.valid).toBe(false); // Vérifie que le champ valid est passé à false
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});

		it("should reject when email already in use", function (done) {
			let anotherUser;

			// Créer un autre utilisateur avec cet email
			bcrypt
				.hash("RandomPass123", salt)
				.then(function (hashedPassword) {
					anotherUser = new User({
						email: "another@example.com",
						password: hashedPassword,
						// Autres champs requis
					});
					return anotherUser.save();
				})
				.then(function () {
					return request(app).put("/email").set("Authorization", authToken).send({
						email: "another@example.com",
					});
				})
				.then(function (response) {
					expect(response.status).toBe(409);
					expect(response.body.result).toBe(false);
					expect(response.body.error).toBe("Email already in use");

					// Nettoyer
					return User.deleteOne({ _id: anotherUser._id });
				})
				.then(function () {
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});

		it("should reject with invalid email format", function (done) {
			request(app)
				.put("/email")
				.set("Authorization", authToken)
				.send({
					email: "not-an-email",
				})
				.then(function (response) {
					expect(response.status).toBe(400);
					expect(response.body.result).toBe(false);
					expect(response.body.errors).toBeTruthy();
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});
	});

	// Tests pour la route de désactivation de compte
	describe("PUT /desactivateAccount", function () {
		it("should deactivate account successfully", function (done) {
			request(app)
				.put("/desactivateAccount")
				.set("Authorization", authToken)
				.then(function (response) {
					expect(response.status).toBe(200);
					expect(response.body.result).toBe(true);

					// Vérifier que le compte a bien été désactivé
					return User.findById(testUser._id);
				})
				.then(function (user) {
					expect(user.disableAccount).toBe(true);
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});

		it("should reject when no token provided", function (done) {
			request(app)
				.put("/desactivateAccount")
				.then(function (response) {
					expect(response.status).toBe(401);
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});
	});

	// Tests pour la route de suppression de compte
	describe("DELETE /deleteAccount", function () {
		it("should delete account successfully", function (done) {
			request(app)
				.delete("/deleteAccount")
				.set("Authorization", authToken)
				.then(function (response) {
					expect(response.status).toBe(200);
					expect(response.body.result).toBe(true);

					// Vérifier que le compte a bien été supprimé
					return User.findById(testUser._id);
				})
				.then(function (user) {
					expect(user).toBeNull();
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});

		it("should reject when account already deleted", function (done) {
			request(app)
				.delete("/deleteAccount")
				.set("Authorization", authToken)
				.then(function (response) {
					expect(response.status).toBe(401); // Le token n'est plus valide car l'utilisateur a été supprimé
					done();
				})
				.catch(function (error) {
					done(error);
				});
		});
	});
});

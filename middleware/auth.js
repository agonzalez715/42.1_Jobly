"use strict"; // Enforces JavaScript's strict mode for better error handling and to avoid some common pitfalls.

const jwt = require("jsonwebtoken"); // Imports the 'jsonwebtoken' library for creating and verifying JWTs.
const { SECRET_KEY } = require("../config"); // Imports the SECRET_KEY from your configuration file. This key is used to sign and verify JWTs.
const { UnauthorizedError } = require("../expressError"); // Imports the UnauthorizedError custom error class for handling unauthorized access cases.

/**
 * Create a JWT from a user object.
 * This function accepts a user object with at least the properties 'username'
 * and 'isAdmin' and generates a JWT which will be used to authenticate
 * the user on subsequent requests.
 *
 * @param {Object} user - The user object
 * @returns {string} - A JWT token
 */
function createToken(user) {
    let payload = {
        username: user.username, // Includes the username in the JWT payload.
        isAdmin: user.isAdmin, // Includes the isAdmin flag in the JWT payload.
    };
    return jwt.sign(payload, SECRET_KEY); // Signs the payload with the secret key to create the JWT.
}

/**
 * Middleware to authenticate a user from a JWT.
 * If a token is provided in the authorization header, it verifies the token,
 * and if valid, stores the decoded user data in 'res.locals.user'.
 * This data includes the 'username' and 'isAdmin' properties.
 *
 * This middleware does not stop the request handling chain if no token is provided;
 * it simply moves to the next middleware without setting 'res.locals.user'.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers && req.headers.authorization; // Retrieves the authorization header from the request.
        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, "").trim(); // Removes the 'Bearer ' prefix from the token.
            res.locals.user = jwt.verify(token, SECRET_KEY); // Verifies the token and stores the decoded data in 'res.locals.user'.
        }
        return next(); // Proceeds to the next middleware.
    } catch (err) {
        return next(); // Proceeds to the next middleware even if there's an error (authentication is optional).
    }
}

/**
 * Middleware to ensure that a user is logged in.
 * If 'res.locals.user' is not set, this indicates that no valid JWT was
 * decoded (either it was not provided or was invalid), and it raises an
 * 'UnauthorizedError', stopping further processing of the request.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
function ensureLoggedIn(req, res, next) {
    try {
        if (!res.locals.user) throw new UnauthorizedError(); // Checks if user data is available, throws error if not.
        return next(); // Proceeds to the next middleware if the user is authenticated.
    } catch (err) {
        return next(err); // Handles the error by passing it to the next error handling middleware.
    }
}

// Exports the functions to be used in other parts of the application.
module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    createToken,
};
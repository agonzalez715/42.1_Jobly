"use strict";

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/** Create a JWT from a user object.
 *
 * This function accepts a user object with at least the properties `username`
 * and `isAdmin` and generates a JWT which will be used to authenticate
 * the user on subsequent requests.
 *
 * @param {Object} user - The user object
 * @returns {string} - A JWT token
 */
function createToken(user) {
    let payload = {
        username: user.username,
        isAdmin: user.isAdmin,
    };
    return jwt.sign(payload, SECRET_KEY);
}

/** Middleware to authenticate a user from a JWT.
 *
 * If a token is provided in the authorization header, it verifies the token,
 * and if valid, stores the decoded user data in `res.locals.user`.
 * This data includes the `username` and `isAdmin` properties.
 *
 * This middleware does not stop the request handling chain if no token is provided;
 * it simply moves to the next middleware without setting `res.locals.user`.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers && req.headers.authorization;
        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, "").trim();
            res.locals.user = jwt.verify(token, SECRET_KEY);
        }
        return next();
    } catch (err) {
        return next();
    }
}

/** Middleware to ensure that a user is logged in.
 *
 * If `res.locals.user` is not set, this indicates that no valid JWT was
 * decoded (either it was not provided or was invalid), and it raises an
 * `UnauthorizedError`, stopping further processing of the request.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
function ensureLoggedIn(req, res, next) {
    try {
        if (!res.locals.user) throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    createToken,
};
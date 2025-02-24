// middleware/authAdmin.js

const { UnauthorizedError } = require("../expressError");

/** Middleware to use when they must be an admin user.
 *
 * If not, raises Unauthorized.
 *
 * This middleware checks if the user stored in res.locals.user
 * (set by authenticateJWT middleware) is logged in and has admin privileges.
 * If these conditions are not met, it raises an UnauthorizedError.
 */

function ensureAdmin(req, res, next) {
  try {
    // Checking res.locals.user to align with authenticateJWT's setting of user data
    if (!res.locals.user || !res.locals.user.isAdmin) {
      throw new UnauthorizedError("Must be an admin");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = ensureAdmin;

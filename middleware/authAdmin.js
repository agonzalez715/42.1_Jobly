// middleware/authAdmin.js

const { UnauthorizedError } = require("../expressError");

/** Middleware to use when they must be an admin user.
 *
 * If not, raises Unauthorized.
 */

function ensureAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedError("Must be an admin");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = ensureAdmin;
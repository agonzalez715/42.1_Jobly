"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const ensureAdmin = require("../middleware/authAdmin");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) { // Added ensureAdmin middleware
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - name (case-insensitive, partial matches)
 * - minEmployees
 * - maxEmployees
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const { name, minEmployees, maxEmployees } = req.query;

  // Validate minEmployees and maxEmployees
  if (minEmployees && maxEmployees && parseInt(minEmployees) > parseInt(maxEmployees)) {
    return next(new BadRequestError("minEmployees cannot be greater than maxEmployees"));
  }

  // Construct the filters object
  const filters = {};
  if (name) filters.name = name;
  if (minEmployees) filters.minEmployees = parseInt(minEmployees);
  if (maxEmployees) filters.maxEmployees = parseInt(maxEmployees);

  try {
    const companies = await Company.findAll(filters);
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle] => { company }
 *
 * Company is { handle, name, description, numEmployees, logoUrl, jobs }
 * where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) { // Added ensureAdmin middleware
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle] => { deleted: handle }
 *
 * Deletes a company.
 *
 * Authorization required: admin
 */

router.delete("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) { // Added ensureAdmin middleware
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
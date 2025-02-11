"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST /jobs => { job }
 *
 * Adds a new job. This route requires admin access.
 * The new job data should include: { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /jobs => { jobs: [ { id, title, salary, equity, company_handle }, ... ] }
 *
 * Returns list of all jobs. Open to all users, no authorization required.
 */

router.get("/", async function (req, res, next) {
  try {
    const jobs = await Job.findAll();
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /jobs/:id => { job }
 *
 * Returns detailed information about a job by id.
 * Open to all users, no authorization required.
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    if (!job) throw new NotFoundError(`No job found with id: ${req.params.id}`);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /jobs/:id => { job }
 *
 * Updates a job's details (title, salary, equity).
 * Updating job ID or company handle is not allowed.
 * This route requires admin access.
 *
 * Returns updated job data: { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /jobs/:id => { deleted: id }
 *
 * Deletes a job by id.
 * This route requires admin access.
 *
 * Returns { deleted: id }
 *
 * Authorization required: admin
 */

router.delete("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
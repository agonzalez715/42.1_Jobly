"use strict";

const db = require("./db");
const bcrypt = require("bcryptjs");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */
class User {
  /** Authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError if user not found or wrong password.
   */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username,
              password,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              is_admin AS "isAdmin"
       FROM users
       WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   */
  static async register({ username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
       (username, password, first_name, last_name, email, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
      [username, hashedPassword, firstName, lastName, email, isAdmin],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, firstName, lastName, email, isAdmin }, ...]
   */
  static async findAll() {
    const result = await db.query(
      `SELECT username,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              is_admin AS "isAdmin"
       FROM users
       ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, firstName, lastName, isAdmin }
   *
   * Throws NotFoundError if user not found.
   */
  static async get(username) {
    const userRes = await db.query(
      `SELECT username,
              first_name AS "firstName",
              last_name AS "lastName",
              email,
              is_admin AS "isAdmin"
       FROM users
       WHERE username = $1`,
      [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    // Fetch job applications for the user
    const applicationsRes = await db.query(
      `SELECT job_id FROM applications WHERE username = $1`,
      [username]
    );

    user.jobs = applicationsRes.rows.map(row => row.job_id);

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the fields; this only changes provided ones.
   *
   * Data can include: { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   */
  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }

  /** Delete given user from database; returns undefined.
   *
   * Throws NotFoundError if user not found.
   */
  static async remove(username) {
    const result = await db.query(
      `DELETE
       FROM users
       WHERE username = $1
       RETURNING username`,
      [username],
    );

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** Apply to a job.
   *
   * Allows a user or admin to apply for a job by creating an application record.
   *
   * Returns { applied: jobId }
   */
  static async applyToJob(username, jobId) {
    // Check if job exists
    const jobCheck = await db.query(
      `SELECT id FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      throw new NotFoundError(`No job found with id: ${jobId}`);
    }

    // Insert application into the database
    await db.query(
      `INSERT INTO applications (job_id, username)
       VALUES ($1, $2)
       ON CONFLICT (job_id, username) DO NOTHING`,
      [jobId, username]
    );

    return { applied: jobId };
  }
}

module.exports = User;
const { BadRequestError } = require("../expressError");

/**
 * Generates a SQL SET clause and corresponding values array for a partial update.
 *
 * Given an object containing the fields to update and an optional mapping from
 * JavaScript-style field names to SQL column names, this function returns an
 * object with:
 *
 * - **setCols**: A string formatted as `"col1"=$1, "col2"=$2, ...` suitable for an SQL UPDATE query.
 * - **values**: An array of values corresponding to the keys in the data object.
 *
 * If the data object is empty, a `BadRequestError` is thrown.
 *
 * @param {Object} dataToUpdate - The key/value pairs to update.
 *        Example: { firstName: 'Aliya', age: 32 }
 *
 * @param {Object} jsToSql - An object mapping JavaScript field names to SQL column names.
 *        If a key in dataToUpdate does not exist in this mapping, its original name is used.
 *        Example: { firstName: 'first_name' }
 *
 * @returns {Object} An object containing:
 *   - setCols: {string} A string for the SET clause of an SQL query.
 *   - values: {Array} An array of values corresponding to the fields.
 *
 * @throws {BadRequestError} If no data is provided (i.e., if dataToUpdate is empty).
 *
 * @example
 * const dataToUpdate = { firstName: 'Aliya', age: 32 };
 * const jsToSql = { firstName: 'first_name' };
 * const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
 * // result is:
 * // {
 * //   setCols: '"first_name"=$1, "age"=$2',
 * //   values: ['Aliya', 32]
 * // }
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // Map each key to a SQL column assignment, using the mapping if provided.
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
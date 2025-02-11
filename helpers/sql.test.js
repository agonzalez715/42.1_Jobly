// helpers/sql.test.js

const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", () => {
  test("works correctly for a single field", () => {
    const dataToUpdate = { firstName: "John" };
    const jsToSql = { firstName: "first_name" };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: `"first_name"=$1`,
      values: ["John"]
    });
  });

  test("works correctly for multiple fields", () => {
    const dataToUpdate = { firstName: "John", age: 30 };
    const jsToSql = { firstName: "first_name" };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: `"first_name"=$1, "age"=$2`,
      values: ["John", 30]
    });
  });

  test("uses field name as-is when not in jsToSql mapping", () => {
    const dataToUpdate = { firstName: "John", age: 30 };
    const jsToSql = {}; // No mapping provided
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: `"firstName"=$1, "age"=$2`,
      values: ["John", 30]
    });
  });

  test("throws an error if no data is provided", () => {
    expect(() => sqlForPartialUpdate({}, { firstName: "first_name" })).toThrow("No data provided");
  });
});
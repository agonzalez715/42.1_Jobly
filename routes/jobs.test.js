const request = require("supertest");
const app = require("../app"); // Adjust the path according to your structure
const db = require("../db");

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token, adminToken } = require("./_testCommon");

// Assuming _testCommon.js handles generic setup like creating users including an admin and normal user

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/** POST /jobs */
describe("POST /jobs", function () {
  const newJob = {
    title: "New Job",
    salary: 100000,
    equity: "0.1",
    company_handle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("Authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New Job",
        salary: 100000,
        equity: "0.1",
        company_handle: "c1"
      },
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("Authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Incomplete Job"
        })
        .set("Authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(400);
  });
});

/** GET /jobs */
describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      jobs: expect.any(Array)
    });
  });
});

/** GET /jobs/:id */
describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`); // Assume id 1 exists from common setup
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      job: expect.any(Object)
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/999999`);
    expect(resp.statusCode).toBe(404);
  });
});

/** PATCH /jobs/:id */
describe("PATCH /jobs/:id", function () {
  test("ok for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({ title: "Updated Job" })
        .set("Authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "Updated Job",
        salary: 100000, // assuming original values
        equity: "0.1",
        company_handle: "c1"
      },
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({ title: "Unauthorized Update" })
        .set("Authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
  });
});

/** DELETE /jobs/:id */
describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("Authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
        .delete(`/jobs/1`)
        .set("Authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
  });
});
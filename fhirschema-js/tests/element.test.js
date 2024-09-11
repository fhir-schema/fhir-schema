import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, opts) => store[url];

let valid = { errors: [] };

test("primitive types", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { kind: "primitive-type", type: "string" },
      integer: { kind: "primitive-type", type: "integer" },
      Resource: {
        name: "Resource",
        elements: {
          id: {
            type: "string",
          },
          numericValue: {
            type: "integer",
          },
        },
      },
    }),
  };

  expect(
    validate(ctx, ["Resource"], {
      resourceType: "Patient",
      id: "r1",
      numericValue: 50,
    }),
  ).toEqual({ errors: [] });

  expect(
    validate(ctx, ["Resource"], {
      resourceType: "Patient",
      id: 1,
      numericValue: "50",
    }),
  ).toMatchObject({
    errors: [{ path: "Patient.id" }, { path: "Patient.numericValue" }],
  });
});

test("elements", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", kind: "primitive-type" },
      Resource: {
        name: "Resource",
        elements: {
          id: {
            type: "string",
          },
        },
      },
    }),
  };

  expect(
    validate(ctx, ["Resource"], { resourceType: "Patient", id: "r1" }),
  ).toEqual(valid);

  expect(
    validate(ctx, ["Resource"], { resourceType: "Patient", id: 1 }),
  ).toEqual({
    errors: [
      {
        message: "expected string, got number",
        path: "Patient.id",
        type: "type",
      },
    ],
  });

  expect(
    validate(ctx, ["Resource"], {
      resourceType: "Patient",
      name: [{ family: "Smith" }],
    }),
  ).toEqual({
    errors: [
      {
        message: "name is unknown",
        path: "Patient.name",
        type: "unknown-element",
      },
    ],
  });
});

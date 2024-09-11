import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, opts) => store[url];

const crCtx = (scms) => ({
  schemaResolver: createSchemaResolver(scms),
});

describe("primitive types", () => {
  describe("positive cases", () => {
    [
      { type: "string", value: "help" },
      { type: "integer", value: 4 },
      { type: "boolean", value: true },
      { type: "boolean", value: false },
    ].forEach(({ type, value }) => {
      test(`Should be valid for ${type} with value ${value}`, () => {
        const ctx = {};
        ctx[type] = { kind: "primitive-type", type };
        expect(validate(crCtx(ctx), [type], value)).toEqual({ errors: [] });
      });
    });
  });

  describe("negative cases", () => {
    [
      {
        type: "string",
        value: 42,
        error: {
          message: "expected string, got number",
          path: "",
          type: "type",
        },
      },
      {
        type: "integer",
        value: "i'm pretty sure this is not an int",
        error: {
          message: "expected integer, got string",
          path: "",
          type: "type",
        },
      },
      {
        type: "integer",
        value: "50",
        error: {
          message: "expected integer, got string",
          path: "",
          type: "type",
        },
      },
      {
        type: "boolean",
        value: "true",
        error: {
          message: "expected boolean, got string",
          path: "",
          type: "type",
        },
      },
      {
        type: "boolean",
        value: null,
        error: {
          message: "expected boolean, got null",
          path: "",
          type: "type",
        },
      },
    ].forEach(({ type, value, error }) => {
      test(`Should fail for ${type} with value ${value}`, () => {
        const ctx = {};
        ctx[type] = { kind: "primitive-type", type };
        expect(validate(crCtx(ctx), [type], value)).toEqual({
          errors: [error],
        });
      });
    });
  });
});

test("Primitive types as part of different schemas", () => {
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

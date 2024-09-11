import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, opts) => store[url];

let valid = { errors: [] };

describe("Schema inheritance tests", () => {
  describe("`type` keyword", () => {
    const ctx = {
      schemaResolver: createSchemaResolver({
        string: { type: "string", kind: "primitive-type" },
        HumanName: {
          name: "HumanName",
          elements: {
            given: { type: "string" },
          },
        },
        Patient: {
          name: "Patient",
          elements: {
            name: {
              type: "HumanName",
            },
          },
        },
      }),
    };

    test("positive case, data uses valid types", () => {
      expect(
        validate(ctx, ["Patient"], {
          resourceType: "Patient",
          name: {
            given: ["John", "Doe"],
          },
        }),
      ).toEqual(valid);
    });

    test("negative case, data violates type constraints", () => {
      expect(
        validate(ctx, ["Patient"], {
          resourceType: "Patient",
          name: {
            given: 42,
          },
        }),
      ).toMatchObject({
        errors: [{ message: "expected string, got number" }],
      });
    });
  });
  describe("`base` keyword", () => {
    const ctx = {
      schemaResolver: createSchemaResolver({
        string: { type: "string", kind: "primitive-type" },
        ResourceA: {
          name: "ResourceA",
          elements: {
            id: {
              type: "string",
            },
          },
        },
        ResourceB: {
          name: "ResourceB",
          base: "ResourceA",
          elements: {
            newProperty: { type: "string" },
          },
        },
      }),
    };

    test("positive case, data uses only known and valid keys", () => {
      expect(
        validate(ctx, ["ResourceB"], {
          resourceType: "Patient",
          id: "id-from-schema-a",
          newProperty: "val",
        }),
      ).toEqual(valid);
    });

    test("negative case, data violates data types from both resourceA and B", () => {
      expect(
        validate(ctx, ["ResourceB"], {
          resourceType: "Patient",
          id: 1,
          newProperty: 1,
        }),
      ).toMatchObject({
        errors: [
          { message: "expected string, got number" },
          { message: "expected string, got number" },
        ],
      });
    });
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

// TODO: patient.name ^ us-core.name unknown-key text

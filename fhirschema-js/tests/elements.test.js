import { describe, expect, test } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

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

    test("positive case, data uses valid types", async () => {
      expect(
        validate(ctx, ["Patient"], {
          resourceType: "Patient",
          name: {
            given: ["John", "Doe"],
          },
        }),
      ).resolves.toEqual(valid);
    });

    test("negative case, data violates type constraints", async () => {
      expect(
        validate(ctx, ["Patient"], {
          resourceType: "Patient",
          name: {
            given: 42,
          },
        }),
      ).resolves.toMatchObject({
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

    test("positive case, data uses only known and valid keys", async () => {
      expect(
        validate(ctx, ["ResourceB"], {
          resourceType: "Patient",
          id: "id-from-schema-a",
          newProperty: "val",
        }),
      ).resolves.toEqual(valid);
    });

    test("negative case, data violates data types from both resourceA and B", async () => {
      expect(
        validate(ctx, ["ResourceB"], {
          resourceType: "Patient",
          id: 1,
          newProperty: 1,
        }),
      ).resolves.toMatchObject({
        errors: [
          { message: "expected string, got number" },
          { message: "expected string, got number" },
        ],
      });
    });
  });
});

test("elements", async () => {
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
  ).resolves.toEqual(valid);

  expect(
    validate(ctx, ["Resource"], { resourceType: "Patient", id: 1 }),
  ).resolves.toEqual({
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
  ).resolves.toEqual({
    errors: [
      {
        message: "name is unknown",
        path: "Patient.name",
        type: "unknown-element",
      },
    ],
  });
});

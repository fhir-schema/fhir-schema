import { expect, test, describe } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("Required elements must be present in data", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", name: "string", kind: "primitive-type" },
      Resource: {
        name: "Resource",
        required: ["a"],
        elements: {
          a: { type: "string" },
          b: { type: "string" },
        },
      },
    }),
  };

  test("positive case, required element is present", async () => {
    expect(
      validate(ctx, ["Resource"], { resourceType: "Patient", a: "valueA" }),
    ).resolves.toEqual({ errors: [] });
  });

  test("negative case, required element is missing", async () => {
    expect(
      validate(ctx, ["Resource"], { resourceType: "Patient", b: "valueB" }),
    ).resolves.toEqual({
      errors: [
        { message: "a is required", path: "Patient.a", type: "required" },
      ],
    });
  });
});

describe("Required elements must be present in data", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", name: "string", kind: "primitive-type" },
      BaseResource: {
        name: "BaseResource",
        required: ["c"],
        elements: {
          c: { type: "string" },
        },
      },
      Resource: {
        name: "Resource",
        base: "BaseResource",
        required: ["a"],
        elements: {
          a: { type: "string" },
          b: { type: "string" },
        },
      },
    }),
  };

  test("positive case, required element is present", async () => {
    expect(
      validate(ctx, ["Resource"], {
        resourceType: "Patient",
        a: "valueA",
        c: "valueC",
      }),
    ).resolves.toEqual({ errors: [] });
  });

  test("negative case, required element is missing", async () => {
    expect(
      validate(ctx, ["Resource"], { resourceType: "Patient", b: "valueB" }),
    ).resolves.toEqual({
      errors: [
        { message: "c is required", path: "Patient.c", type: "required" },
        { message: "a is required", path: "Patient.a", type: "required" },
      ],
    });
  });
});

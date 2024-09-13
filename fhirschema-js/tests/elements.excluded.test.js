import { expect, test, describe } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("Excluded elements must not be present in data", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", kind: "primitive-type" },
      Resource: {
        name: "Resource",
        excluded: ["a"],
        elements: {
          a: { type: "string" },
          b: { type: "string" },
        },
      },
    }),
  };

  test("positive case, excluded element is absent", async () => {
    expect(
      validate(ctx, ["Resource"], { resourceType: "Patient", b: "valueB" }),
    ).resolves.toEqual({ errors: [] });
  });

  test("negative case, excluded element is present", async () => {
    expect(
      validate(ctx, ["Resource"], { resourceType: "Patient", a: "valueA" }),
    ).resolves.toEqual({
      errors: [
        {
          message: "excluded property a is present",
          path: "Patient.a",
          type: "excluded",
        },
      ],
    });
  });
});

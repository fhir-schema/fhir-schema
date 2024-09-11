import { expect, test, describe } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("fhirpath constraints", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", kind: "primitive-type" },
      ResourceA: {
        name: "Resource",
        constraints: {
          constraintA: {
            severity: "error",
            expression: "ResourceA.propertyA = 'someValue'",
            human: "propertyA must be equal to someValue",
          },
        },
        elements: {
          propertyA: { type: "string" },
        },
      },
    }),
  };

  test("positive case, data passes constraint test", () => {
    expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        propertyA: "someValue",
      }),
    ).toEqual({ errors: [] });
  });

  test("negative case, data fails constraint test", () => {
    expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        propertyA: "invalidValue",
      }),
    ).toEqual({
      errors: [
        {
          constraint: "constraintA",
          message:
            "FHIRPath constraint constraintA error: propertyA must be equal to someValue",
          path: "ResourceA",
          type: "fhirpath-constraint",
        },
      ],
    });
  });
});

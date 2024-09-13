import { expect, test, describe } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("fhirpath constraints", () => {
  const ctx = {
    termServerUrl: "https://tx.fhir.org/r4/ValueSet/$validate-code",
    schemaResolver: createSchemaResolver({
      code: { type: "code", kind: "primitive-type" },
      ResourceA: {
        name: "Resource",
        elements: {
          gender: {
            type: "code",
            binding: {
              valueSet: "http://hl7.org/fhir/administrative-gender",
              strength: "required",
            },
          },
        },
      },
    }),
  };

  test("positive case, code", () => {
    expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        gender: "male",
      }),
    ).toEqual({ errors: [] });
  });

  test("negative case, code", () => {
    expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        gender: "animallll",
      }),
    ).toEqual({ errors: [{}] });
  });
});

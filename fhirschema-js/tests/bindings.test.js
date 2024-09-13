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
              valueSet: "http://hl7.org/fhir/ValueSet/administrative-gender",
              strength: "required",
            },
          },
        },
      },
    }),
  };

  test("positive case, code", async () => {
    await expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        gender: "male",
      }),
    ).resolves.toEqual({ errors: [] });
  });

  test("negative case, code", async () => {
    await expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        gender: "animallll",
      }),
    ).resolves.toEqual({
      errors: [
        {
          binding: {
            strength: "required",
            valueSet: "http://hl7.org/fhir/ValueSet/administrative-gender",
          },
          message:
            "Provided coded value 'animallll' does not pass validation against the following valueset: 'http://hl7.org/fhir/ValueSet/administrative-gender'",
          path: "ResourceA.gender",
          type: "terminology-binding",
        },
      ],
    });
  });
});

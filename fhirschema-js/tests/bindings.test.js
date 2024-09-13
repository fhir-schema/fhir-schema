import { expect, test, describe } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("fhirpath constraints", () => {
  const ctx = {
    terminiologyResolver: (r) => {
      const code = r.parameter.find((param) => param.name === "code").valueCode;
      switch (code) {
        case "male":
          return { parameter: [{ name: "result", valueBoolean: true }] };
        default:
          return { parameter: [{ name: "result", valueBoolean: false }] };
      }
    },
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
    ).toEqual({
      errors: [
        {
          binding: {
            strength: "required",
            valueSet: "http://hl7.org/fhir/administrative-gender",
          },
          message:
            "Provided coded value 'animallll' does not pass validation against the following valueset: 'http://hl7.org/fhir/administrative-gender'",
          path: "ResourceA.gender",
          type: "terminology-binding",
        },
      ],
    });
  });
});

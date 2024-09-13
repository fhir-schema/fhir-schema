import { expect, test, describe } from "bun:test";
import { validate } from "../src/index.js";
const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("The `pattern` directive requires data to have at least the specified property values", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", kind: "primitive-type" },
      HumanName: {
        name: "HumanName",
        elements: {
          given: { type: "string", array: true },
          family: { type: "string" },
          prefix: { type: "string" },
        },
      },
      Patient: {
        name: "Patient",
        elements: {
          name: {
            type: "HumanName",
            array: true,
          },
        },
      },
      PatientProfile: {
        base: "Patient",
        elements: {
          name: { pattern: { given: ["John"], family: "Doe" } },
        },
      },
    }),
  };

  describe("positive cases", () => {
    test("data contains valid name matching the `pattern`", () => {
      expect(
        validate(ctx, ["PatientProfile"], {
          resourceType: "Patient",
          name: [{ given: ["John"], family: "Doe" }],
        }),
      ).toEqual({ errors: [] });
    });

    test("data contains additional properties beyond the `pattern`", () => {
      expect(
        validate(ctx, ["PatientProfile"], {
          resourceType: "Patient",
          name: [{ given: ["John"], family: "Doe", prefix: ["Mr."] }],
        }),
      ).toEqual({ errors: [] });
    });
  });

  describe("negative cases", () => {
    test("data is missing a required property from the `pattern`", () => {
      expect(
        validate(ctx, ["PatientProfile"], {
          resourceType: "Patient",
          name: [{ given: ["John"] }],
        }),
      ).toEqual({
        errors: [
          {
            message:
              'Expected value to match \'pattern\' \'{"given":["John"],"family":"Doe"}\', but got: \'{"given":["John"]}\'',
            path: "Patient.name.0",
            type: "pattern-value",
          },
        ],
      });
    });

    test("data has a different value for a property specified in the `pattern`", () => {
      expect(
        validate(ctx, ["PatientProfile"], {
          resourceType: "Patient",
          name: [{ given: ["Jane"], family: "Doe" }],
        }),
      ).toEqual({
        errors: [
          {
            message:
              'Expected value to match \'pattern\' \'{"given":["John"],"family":"Doe"}\', but got: \'{"given":["Jane"],"family":"Doe"}\'',
            path: "Patient.name.0",
            type: "pattern-value",
          },
        ],
      });
    });
  });
});

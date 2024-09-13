import { describe, expect, test } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("The `fixed` directive functions as a constant declaration and requires an exact match", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", kind: "primitive-type" },
      HumanName: {
        name: "HumanName",
        elements: {
          given: { type: "string", array: true },
          family: { type: "string" },
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
          name: { fixed: { given: ["M", "Ger"], family: "Jovan" } },
        },
      },
    }),
  };

  describe("positive cases", () => {
    test("data contains valid name equals to `fixed` value", async () => {
      expect(
        validate(ctx, ["PatientProfile"], {
          resourceType: "Patient",
          name: [{ given: ["M", "Ger"], family: "Jovan" }],
        }),
      ).resolves.toEqual({ errors: [] });
    });
  });

  describe("negative cases", () => {
    test("data contains name with additional givens", async () => {
      expect(
        validate(ctx, ["PatientProfile"], {
          resourceType: "Patient",
          name: [{ given: ["M", "Ger", "Q"], family: "Jovan" }],
        }),
      ).resolves.toEqual({
        errors: [
          {
            message:
              'Expected value to be exactly equal to \'fixed\' pattern \'{"given":["M","Ger"],"family":"Jovan"}\', but got: \'{"given":["M","Ger","Q"],"family":"Jovan"}\'',
            path: "Patient.name.0",
            type: "fixed-value",
          },
        ],
      });
    });
  });
});

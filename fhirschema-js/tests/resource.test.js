import { expect, test, describe } from "bun:test";
import { validate } from "../src/index.js";
const createSchemaResolver = (store) => (url, _opts) => store[url];

describe(`If Schema type is 'Resource', engine additionally validates data via schema mentioned in datas 'resourceType' property`, () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", name: "string", kind: "primitive-type" },
      BackboneElement: {
        name: "BackboneElement",
      },
      Resource: { name: "Resource" },
      Bundle: {
        name: "Bundle",
        elements: {
          entry: {
            type: "BackboneElement",
            array: true,
            elements: {
              resource: { type: "Resource" },
            },
          },
        },
      },
      HumanName: {
        name: "HumanName",
        elements: {
          given: { type: "string", array: true },
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
    }),
  };

  describe("positive cases", () => {
    test("Patient entry validates via actual Patient schema", () => {
      expect(
        validate(ctx, ["Bundle"], {
          resourceType: "Bundle",
          entry: [
            {
              resource: {
                resourceType: "Patient",
                name: [{ given: ["John"] }],
              },
            },
          ],
        }),
      ).toEqual({ errors: [] });
    });
  });

  describe("negative cases", () => {
    test("Patient entry validates via actual Patient schema, invalid name prop", () => {
      expect(
        validate(ctx, ["Bundle"], {
          resourceType: "Bundle",
          entry: [
            {
              resource: {
                resourceType: "Patient",
                name: [{ given: [10] }],
              },
            },
          ],
        }),
      ).toEqual({
        errors: [
          {
            message: "expected string, got number",
            path: "Bundle.entry.0.resource.name.0.given.0",
            type: "type",
          },
        ],
      });
    });
  });
});

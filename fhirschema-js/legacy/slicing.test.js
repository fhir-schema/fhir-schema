import { expect, test, describe } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("slicing", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", name: "string", kind: "primitive-type" },
      integer: { type: "integer", name: "integer", kind: "primitive-type" },
      url: { type: "url", name: "url", kind: "primitive-type" },
      "https://fhirschema.org/StructureDefintion/someNote": {
        base: "Extension",
        name: "someNote",
        elements: {
          url: { fixed: "https://fhirschema.org/StructureDefintion/someNote" },
          extension: {
            slicing: {
              slices: {
                mdPart: {
                  max: 1,
                  min: 1,
                  schema: {
                    elements: { value: { choices: ["valueString"] } },
                  },
                  match: {
                    type: "pattern",
                    value: {
                      url: "mdPart",
                    },
                  },
                },
              },
            },
          },
        },
      },
      Element: {
        base: null,
        name: "Element",
        elements: {
          id: { type: "string" },
          extension: { type: "Extension" },
        },
      },
      Extension: {
        base: "Element",
        name: "Extension",
        elements: {
          url: { type: "url" },
          value: { choices: ["valueString", "valueInteger"] },
          valueString: { type: "string", choiceOf: "value" },
          valueInteger: { type: "integer", choiceOf: "value" },
        },
      },
      ResourceA: {
        name: "ResourceA",
        base: null,
        elements: {
          propertyWithExtensions: {
            type: "Extension",
          },
        },
      },
    }),
  };

  describe("positive cases", () => {
    test("extension defined by url is valid", () => {
      expect(
        validate(ctx, ["ResourceA"], {
          resourceType: "ResourceA",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote",
            extension: [{ url: "mdPart", valueString: "test" }],
          },
        }),
      ).toEqual({ errors: [] });
    });
  });

  describe("negative cases", () => {
    test("cardinality violation", () => {
      expect(
        validate(ctx, ["ResourceA"], {
          resourceType: "ResourceA",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote",
            extension: [{ url: "unknown", valueString: "excessive" }],
          },
        }),
      ).toEqual({
        errors: [
          {
            message:
              "Slice defines the following min cardinality: '1', actual cardinality: '0'",
            path: "ResourceA.propertyWithExtensions.extension",
            type: "slice-cardinality",
          },
        ],
      });

      expect(
        validate(ctx, ["ResourceA"], {
          resourceType: "ResourceA",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote",
            extension: [
              { url: "mdPart", valueString: "test" },
              { url: "mdPart", valueString: "excessive" },
            ],
          },
        }),
      ).toEqual({
        errors: [
          {
            message:
              "Slice defines the following max cardinality: '1', actual cardinality: '2'",
            path: "ResourceA.propertyWithExtensions.extension",
            type: "slice-cardinality",
          },
        ],
      });
    });

    test("slice matched, slice schema violation", () => {
      expect(
        validate(ctx, ["ResourceA"], {
          resourceType: "ResourceA",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote",
            extension: [{ url: "mdPart", valueInteger: 1 }],
          },
        }),
      ).toEqual({
        errors: [
          {
            message:
              "only one of the choices from the list ['valueString'] is allowed, but ['valueInteger'] was found",
            path: "ResourceA.propertyWithExtensions.extension.0.valueInteger",
            type: "choice",
          },
        ],
      });
    });
  });
});

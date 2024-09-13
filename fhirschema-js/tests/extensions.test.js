import { describe, expect, test } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

describe("If the extension type is met in the data, validate both the extension type itself and the extension profile referenced by the url property.", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", name: "string", kind: "primitive-type" },
      integer: { type: "integer", name: "integer", kind: "primitive-type" },
      url: { type: "url", name: "url", kind: "primitive-type" },
      "https://fhirschema.org/StructureDefintion/someNote": {
        base: "Extension",
        name: "someNote",
        required: ["valueString"],
        elements: {
          url: { fixed: "https://fhirschema.org/StructureDefintion/someNote" },
          value: { choices: ["valueString"] },
        },
      },
      "https://fhirschema.org/StructureDefintion/someNote2": {
        base: "Extension",
        name: "someNote2",
        elements: {
          url: { fixed: "https://fhirschema.org/StructureDefintion/someNote2" },
          value: { choices: ["valueString", "valueInteger"] },
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
      ResourceB: {
        name: "ResourceB",
        base: null,
        elements: {
          propertyWithExtensions: {
            type: "Extension",
            elements: { value: { choices: ["valueString"] } },
          },
        },
      },
    }),
  };

  describe("positve cases", () => {
    test("extesion defined by url is valid", async () => {
      expect(
        validate(ctx, ["ResourceA"], {
          resourceType: "ResourceA",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote",
            valueString: "my-value",
          },
        }),
      ).resolves.toEqual({ errors: [] });
    });

    test("constraint on extension property declaration (not in extension itself)", async () => {
      expect(
        validate(ctx, ["ResourceB"], {
          resourceType: "ResourceB",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote2",
            valueString: "m-val",
          },
        }),
      ).resolves.toEqual({
        errors: [],
      });
    });
  });

  describe("negative cases", () => {
    test("simple: extesion defined by url is validated and report an error", async () => {
      expect(
        validate(ctx, ["ResourceA"], {
          resourceType: "ResourceA",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote",
            valueInteger: 4,
          },
        }),
      ).resolves.toEqual({
        errors: [
          {
            message: "valueString is required",
            path: "ResourceA.propertyWithExtensions.valueString",
            type: "required",
          },
          {
            message:
              "only one of the choices from the list ['valueString'] is allowed, but ['valueInteger'] was found",
            path: "ResourceA.propertyWithExtensions.valueInteger",
            type: "choice",
          },
        ],
      });
    });

    test("2. extesion defined by url is validated and report an error (combined case for mistype and choice error)", async () => {
      expect(
        validate(ctx, ["ResourceA"], {
          resourceType: "ResourceA",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote",
            valueInteger: "not-int",
          },
        }),
      ).resolves.toEqual({
        errors: [
          {
            message: "valueString is required",
            path: "ResourceA.propertyWithExtensions.valueString",
            type: "required",
          },
          {
            message:
              "only one of the choices from the list ['valueString'] is allowed, but ['valueInteger'] was found",
            path: "ResourceA.propertyWithExtensions.valueInteger",
            type: "choice",
          },
          {
            message: "expected integer, got string",
            path: "ResourceA.propertyWithExtensions.valueInteger",
            type: "type",
          },
        ],
      });
    });

    test("constraint on extension property declaration (not in extension itself)", async () => {
      expect(
        validate(ctx, ["ResourceB"], {
          resourceType: "ResourceB",
          propertyWithExtensions: {
            url: "https://fhirschema.org/StructureDefintion/someNote2",
            valueInteger: 4,
          },
        }),
      ).resolves.toEqual({
        errors: [
          {
            message:
              "only one of the choices from the list ['valueString'] is allowed, but ['valueInteger'] was found",
            path: "ResourceB.propertyWithExtensions.valueInteger",
            type: "choice",
          },
        ],
      });
    });
  });
});

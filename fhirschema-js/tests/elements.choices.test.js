import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, opts) => store[url];

describe("`choiceOf` directive", () => {
  const ctx = {
    schemaResolver: createSchemaResolver({
      string: { type: "string", kind: "primitive-type" },
      integer: { type: "integer", kind: "primitive-type" },
      ResourceA: {
        name: "ResourceA",
        elements: {
          choicePrefix: {
            choices: ["choicePrefixString"],
          },
          choicePrefixString: { choiceOf: "choicePrefix", type: "string" },
          choicePrefixInteger: { choiceOf: "choicePrefix", type: "integer" },
        },
      },
    }),
  };

  test("positive case, valid choice type", () => {
    expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        choicePrefixString: "valid string",
      }),
    ).toEqual({ errors: [] });
  });

  test("negative case, multiple choices used (only one allowed)", () => {
    expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        choicePrefixString: "valid string",
        choicePrefixInteger: 42,
      }),
    ).toEqual({
      errors: [
        {
          message:
            "only one choice for 'choicePrefix' allowed, but multiple found: choicePrefixInteger, choicePrefixString",
          path: "ResourceA.choicePrefixInteger",
          type: "choice",
        },
        {
          message:
            "only one of the choices from the list '[\"choicePrefixString\"]' is allowed, but 'choicePrefixInteger' was found",
          path: "ResourceA.choicePrefixInteger",
          type: "choice",
        },
      ],
    });
  });

  test("negative case, choices a constrained with `choices:` directive", () => {
    expect(
      validate(ctx, ["ResourceA"], {
        resourceType: "ResourceA",
        choicePrefixInteger: 4,
      }),
    ).toEqual({
      errors: [
        {
          message:
            "only one of the choices from the list '[\"choicePrefixString\"]' is allowed, but 'choicePrefixInteger' was found",
          path: "ResourceA.choicePrefixInteger",
          type: "choice",
        },
      ],
    });
  });
});

// describe("Limit possible choice type via `choice` directive", () => {
//   const ctx = {
//     schemaResolver: createSchemaResolver({
//       string: { type: "string", kind: "primitive-type" },
//       integer: { type: "integer", kind: "primitive-type" },
//       boolean: { type: "boolean", kind: "primitive-type" },
//       ResourceA: {
//         name: "ResourceA",
//         elements: {
//           choicePrefix: {
//             choices: [
//               "choicePrefixString",
//               "choicePrefixInteger",
//               "choicePrefixBoolean",
//             ],
//           },
//           choicePrefixString: { choiceOf: "choicePrefix", type: "string" },
//           choicePrefixInteger: { choiceOf: "choicePrefix", type: "integer" },
//           choicePrefixBoolean: { choiceOf: "choicePrefix", type: "boolean" },
//         },
//       },
//       ProfileOnA: {
//         name: "ProfileOnA",
//         base: "ResourceA",
//         required: ["choicePrefixString"],
//         elements: {
//           choicePrefix: {
//             choices: ["choicePrefixString"],
//           },
//         },
//       },
//     }),
//   };

//   test("positive case, valid choice type", () => {
//     expect(
//       validate(ctx, ["ResourceA"], {
//         resourceType: "ResourceA",
//         choicePrefixString: "valid string",
//       }),
//     ).toEqual({ errors: [] });
//   });

//   test("positive case, valid choice type", () => {
//     expect(
//       validate(ctx, ["ProfileOnA"], {
//         resourceType: "ResourceA",
//         choicePrefixString: "valid string",
//       }),
//     ).toEqual({ errors: [] });
//   });

//   test("negative case, multiple choices used (only one allowed)", () => {
//     expect(
//       validate(ctx, ["ResourceA"], {
//         resourceType: "ResourceA",
//         choicePrefixString: "valid string",
//         choicePrefixInteger: 42,
//       }),
//     ).toEqual({
//       errors: [
//         {
//           message: "only one choice allowed, but multiple found",
//           path: "ProfileOnA",
//           type: "choice",
//         },
//       ],
//     });
//   });

//   test("negative case, choice type not allowed by ProfileOnA", () => {
//     expect(
//       validate(ctx, ["ProfileOnA"], {
//         resourceType: "ResourceA",
//         choicePrefixInteger: 42,
//       }),
//     ).toEqual({
//       errors: [
//         {
//           message: "choicePrefixInteger is not allowed by ProfileOnA",
//           path: "ProfileOnA.choicePrefixInteger",
//           type: "choice",
//         },
//       ],
//     });
//   });
// });

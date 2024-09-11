const fhirpath = require("fhirpath");

function addError(result, type, message) {
  result.errors.push({
    type: type,
    path: result.path.join("."),
    message: message,
  });
}

function formatValue(v) {
  if (Array.isArray(v)) {
    return `[${v.map((v) => `'${v}'`).join(", ")}]`;
  }
  return `'${v}'`;
}

function getType(input) {
  const type = Object.prototype.toString.call(input);
  switch (type) {
    case "[object Array]":
      return "array";
    case "[object Object]":
      return "object";
    case "[object String]":
      return "string";
    case "[object Number]":
      return "number";
    case "[object Boolean]":
      return "boolean";
    case "[object Null]":
      return "null";
    case "[object Undefined]":
      return "null";
    case "[object Date]":
      return "date";
    default:
      return "unknown";
  }
}

function isPrimitive(tp) {
  return tp.toLowerCase() === tp;
}

const fhirPrimitiveTypeValidators = {
  integer: (data, schema, result) =>
    Number.isSafeInteger(data)
      ? null
      : `expected ${schema.type}, got ${getType(data)}`,
  string: (data, schema, result) => {
    if (!(getType(data) === "string")) {
      return `expected ${schema.type}, got ${getType(data)}`;
    }
  },
  boolean: (data, schema, result) => {
    if (!(getType(data) === "boolean")) {
      return `expected ${schema.type}, got ${getType(data)}`;
    }
  },
};

function validatePrimitiveType(ctx, result, schema, data) {
  const primitiveValidator = fhirPrimitiveTypeValidators[schema.type];
  console.assert(
    primitiveValidator,
    `No validator for primititve type ${schema.type} of schema ${schema}`,
  );

  const err = primitiveValidator(data, schema);

  if (err) {
    addError(result, "type", err);
  }
}

function validateRequired(ctx, result, schema, data) {
  let tp = getType(data);
  if (tp == "object") {
    schema.required.forEach((k) => {
      result.path.push(k);
      if (!(k in data)) {
        addError(result, "required", `${k} is required`);
      }
      result.path.pop();
    });
  } else {
    addError(result, "type", `expected object got ${tp}`);
  }
}

function validateExcluded(ctx, result, schema, data) {
  let tp = getType(data);
  if (tp == "object") {
    schema.excluded.forEach((k) => {
      result.path.push(k);
      if (k in data) {
        addError(result, "excluded", `excluded property ${k} is present`);
      }
      result.path.pop();
    });
  } else {
    addError(result, "type", `expected object got ${tp}`);
  }
}

function ensureArray(data) {
  let tp = getType(data);
  if (tp !== "array") {
    addError(result, "type", `expected array got ${tp}`);
    return true;
  }
}

function validateMax(ctx, result, schema, data) {
  if (ensureArray(data)) {
    return;
  }
  if (data.length > schema) {
    addError(result, "max", `expected ${schema} < ${data.length}`);
  }
}

function validateMin(ctx, result, schema, data) {
  if (ensureArray(data)) {
    return;
  }
  if (data.length < schema) {
    addError(result, "min", `expected ${schema} > ${data.length}`);
  }
}

function validateArray(ctx, result, schema, data) {
  if (!Array.isArray(data)) {
    addError(result, "not-array", "expected array");
  }
}

function validateElements(ctx, result, schema, data) {
  let type = getType(data);
  if (type !== "object") {
    addError(result, "type", `expected object, got ${type}`);
  }
}

function isMap(x) {
  return x?.constructor == {}.constructor;
}

// array and type should work together

let VALIDATORS = (sc) =>
  [
    [(sc) => "required" in sc, validateRequired],
    [(sc) => "excluded" in sc, validateExcluded],
    [(sc) => sc.kind === "primitive-type", validatePrimitiveType],
    [(sc) => "elements" in sc, validateElements],
  ]
    .filter((el) => el[0](sc))
    .map((el) => el[1]);

let ARRAY_VALIDATORS = {
  array: validateArray,
  max: validateMax,
  min: validateMin,
};

function resolveSchema(ctx, schemaName) {
  let sch = ctx.schemaResolver(schemaName);
  if (sch) {
    return sch;
  } else {
    throw new Error("could not resolve [" + schemaName + "]");
  }
}

function set() {
  return {};
}

function each(obj, f) {
  for (var k in obj) {
    var v = obj[k];
    f(k, v);
  }
}

function addSchemaToSet(ctx, set, schema) {
  if (schema) {
    if (schema.base && !set[schema.base]) {
      addSchemaToSet(ctx, set, resolveSchema(ctx, schema.base));
    }
    if (schema.type && !set[schema.type] && schema.kind !== "primitive-type") {
      let tp = resolveSchema(ctx, schema.type);
      if (tp) {
        addSchemaToSet(ctx, set, tp);
      }
    }
    set[schema.name] = schema;
  }
}

function validateSchemasArray(ctx, result, schemas, data) {
  each(schemas, (schk, sch) => {
    each(sch, (k, val) => {
      let validator = ARRAY_VALIDATORS[k];
      if (validator) {
        validator(ctx, result, val, data);
      }
    });
  });
}

// 1. shape validation (isObject/isArray/isPrimitive?)
// 2. type validation (resolve types / check primitives) — type and elements keywords
// 2.1 :type / :base
// 2.2 :elements
// 2.3 :required
// 2.4 :excluded
// 2.5 :min/:max
// 2.6 :slicing
// 2.7 :constraints
// 2.8 :binding
// 2.9 :choices / choiceOf
// 2.10 :elementReference

// validate(schemas, data)
//   each schemas s
//      each s.keyword
//         validate_keyword(data)
//   each data (k, v)=>
//     el-schs = schemas_for_key(k)
//     if el-schs empty => error(unkown key)
//     if array(v)
//        validateArray(el-schs, v)
//        each v
//          validate(el-schs, v)
//     else
//        validate(el-schs, v)

function checkOnlyOneChoicePresent(metChoices, choiceOf, elementKey, result) {
  if (metChoices[choiceOf]) {
    addError(
      result,
      "choice",
      `only one choice for ${formatValue(choiceOf)} allowed, but multiple found: ${formatValue([elementKey, ...metChoices[choiceOf]])}`,
    );
  }
}

// let intersection = arrA.filter((x) => arrB.includes(x));

function checkChoiceIsIncludedInChoiceList(metChoices, schema, result) {
  each(metChoices, (choiceOf, exactChoices) => {
    const allowedChoices = schema?.elements?.[choiceOf];
    if (!!allowedChoices) {
      const notAlowedChoicePresent = exactChoices.some(
        (exactChoice) => !allowedChoices.choices.includes(exactChoice),
      );
      if (notAlowedChoicePresent) {
        addError(
          result,
          "choice",
          `only one of the choices from the list ${formatValue(allowedChoices.choices)} is allowed, but ${formatValue(exactChoices)} was found`,
        );
      }
    }
  });
}

function validateSchemas(ctx, result, schemas, data) {
  each(schemas, (schk, sch) => {
    VALIDATORS(sch).forEach((validator) => validator(ctx, result, sch, data));
  });

  if (isMap(data)) {
    const metChoices = {}; // ;; kv "choiceOf" -> choice, candidate for NODE CTX or smth?

    each(data, (k, v) => {
      if (result.root && k == "resourceType") {
        result.root = false;
      } else {
        let elset = set();
        result.path.push(k);
        each(schemas, (schk, sch) => {
          let subsch = sch?.elements?.[k];

          if (subsch) {
            subsch.name = sch.name + "." + k; // TODO FIXME
            addSchemaToSet(ctx, elset, subsch);

            const choiceOf = subsch.choiceOf;
            if (!!choiceOf) {
              checkOnlyOneChoicePresent(metChoices, choiceOf, k, result);
              metChoices[choiceOf] = [...(metChoices[choiceOf] || []), k];
            }
          }
        });

        // post schemas spin validations
        each(schemas, (_, schema) => {
          checkChoiceIsIncludedInChoiceList(metChoices, schema, result);
        });

        if (Object.keys(elset).length === 0) {
          addError(result, "unknown-element", `${k} is unknown`);
        } else {
          if (Array.isArray(v)) {
            validateSchemasArray(ctx, result, elset, v);
            v.forEach((x, i) => {
              result.path.push(i);
              validateSchemas(ctx, result, elset, x);
              result.path.pop();
            });
          } else {
            validateSchemas(ctx, result, elset, v);
          }
        }
        result.path.pop();
      }
    });
  }
}

export function validate(ctx, schemaNames, data) {
  let schset = set();
  let result = { root: true, errors: [], path: [data?.resourceType] };
  schemaNames.forEach((x) => {
    addSchemaToSet(ctx, schset, resolveSchema(ctx, x));
  });
  validateSchemas(ctx, result, schset, data);
  return { errors: result.errors };
}

let ctx = {
  resource: {
    required: ["id"],
    elements: { id: { type: "string" } },
  },
  HumanName: {
    elements: {
      family: { type: "string" },
      given: { type: "string", array: true },
    },
  },
  patient: {
    base: "resource",
    required: ["birthDate"],
    elements: {
      name: { array: true, type: "HumanName" },
    },
  },
  string: {},
  "us-patient": {
    base: "patient",
    require: ["name"],
    elements: { name: { min: 1 } },
  },
};

// console.log(validate(ctx, ['patient'], {id: 'pt1', name: [{family: 'ryz', given: [1], extra: 'ups'}, 1], ups: 'ups'}))

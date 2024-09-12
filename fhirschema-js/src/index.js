import fhirpath from "fhirpath";
import _ from "lodash";

function isMap(x) {
  return x?.constructor === {}.constructor;
}

function formatValue(v) {
  if (Array.isArray(v)) {
    return `[${v.map((v) => `'${v}'`).join(", ")}]`;
  } else if (isMap(v)) {
    return `'${JSON.stringify(v)}'`;
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

function addError(result, type, message) {
  let err = {
    type: type,
    path: result.path.join("."),
  };
  if (isMap(message)) {
    err = { ...err, ...message };
  } else {
    err.message = message;
  }

  result.errors.push(err);
}

const fhirPrimitiveTypeValidators = {
  integer: (data, schema) =>
    Number.isSafeInteger(data)
      ? null
      : `expected ${schema.type}, got ${getType(data)}`,
  string: (data, schema) => {
    if (!(getType(data) === "string")) {
      return `expected ${schema.type}, got ${getType(data)}`;
    }
  },
  url: (data, schema) => {
    if (!(getType(data) === "string")) {
      return `expected ${schema.type}, got ${getType(data)}`;
    }
  },
  boolean: (data, schema) => {
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
  if (tp === "object") {
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
  if (tp === "object") {
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
    // addError(result, "type", `expected array got ${tp}`);
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

function validateConstraints(ctx, result, schema, data) {
  each(schema.constraints, (constraintId, { expression, severity, human }) => {
    if (severity === "error") {
      const evalResult = fhirpath.evaluate(
        data,
        expression,
        {},
        ctx.fhirpathModel,
      );
      console.assert(
        evalResult.length === 1,
        `Validation engine awaits only one evaluation result, but FHIRPath expression ${formatValue(expression)} returned ${formatValue(result)}`,
      );
      console.assert(
        getType(evalResult[0]) === "boolean",
        `Expected boolean as a result of evaluation ${formatValue(expression)}, but got ${formatValue(result)}`,
      );
      if (!evalResult[0]) {
        addError(result, "fhirpath-constraint", {
          message: `FHIRPath constraint ${constraintId} error: ${human || 'property "human" is not provided'}`,
          constraint: constraintId,
        });
      }
    }
  });
}

function validateFixed(ctx, result, schema, data) {
  const fixedValue = schema.fixed;
  if (!_.isEqual(data, fixedValue)) {
    addError(
      result,
      "fixed-value",
      `Expected value to be exactly equal to 'fixed' pattern ${formatValue(fixedValue)}, but got: ${formatValue(data)}`,
    );
  }
}

function validatePattern(ctx, result, schema, data) {
  const patternValue = schema.pattern;
  if (!_.isMatch(data, patternValue)) {
    addError(
      result,
      "pattern-value",
      `Expected value to match 'pattern' ${formatValue(patternValue)}, but got: ${formatValue(data)}`,
    );
  }
}

let VALIDATORS = (sc) =>
  [
    [(sc) => "fixed" in sc, validateFixed],
    [(sc) => "pattern" in sc, validatePattern],
    [(sc) => "constraints" in sc, validateConstraints],
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

function resolveSchemaFromUrl(ctx, schemaName, path) {
  let sch = ctx.schemaResolver(schemaName);
  if (sch) {
    return sch;
  } else {
    throw new Error(
      `could not resolve ${formatValue(schemaName)} from ${formatValue([...path, "url"])}`,
    );
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

function isReferenceOnExtension(ref) {
  return ref === "Extension";
}

function addSchemasToSet(ctx, set, schema) {
  if (schema) {
    if (schema.base && !set[schema.base]) {
      addSchemasToSet(ctx, set, resolveSchema(ctx, schema.base));
    }
    if (schema.type && !set[schema.type] && schema.kind !== "primitive-type") {
      const resolvedTypeSchema = resolveSchema(ctx, schema.type);
      if (resolvedTypeSchema) {
        addSchemasToSet(ctx, set, resolvedTypeSchema);
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

function checkChoiceIsIncludedInChoiceList(metChoices, schema, result) {
  each(metChoices, (choiceOf, exactChoices) => {
    const allowedChoices = schema?.elements?.[choiceOf];
    if (allowedChoices) {
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
    const metChoices = {};
    let dataIsExtension = false;

    each(data, (k, v) => {
      if (result.root && k === "resourceType") {
        result.root = false;
      } else {
        let elset = set();
        result.path.push(k);
        each(schemas, (schk, sch) => {
          let subsch = sch?.elements?.[k];

          if (subsch) {
            subsch.name = sch.name + "." + k; // TODO FIXME
            addSchemasToSet(ctx, elset, subsch);

            if (isReferenceOnExtension(subsch.type)) {
              dataIsExtension = true;
            }

            const choiceOf = subsch.choiceOf;
            if (choiceOf) {
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
              if (dataIsExtension) {
                addSchemasToSet(
                  ctx,
                  elset,
                  resolveSchemaFromUrl(ctx, x.url, result.path),
                );
              }
              validateSchemas(ctx, result, elset, x);
              result.path.pop();
            });
          } else {
            if (dataIsExtension) {
              addSchemasToSet(
                ctx,
                elset,
                resolveSchemaFromUrl(ctx, v.url, result.path),
              );
            }
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
    addSchemasToSet(ctx, schset, resolveSchema(ctx, x));
  });
  validateSchemas(ctx, result, schset, data);
  return { errors: result.errors };
}

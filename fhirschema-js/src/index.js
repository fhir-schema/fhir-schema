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
  code: (data, schema) => {
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
  const primitiveValidator = fhirPrimitiveTypeValidators[schema.name];
  console.assert(
    primitiveValidator,
    `No validator for primititve type ${schema.type} of schema`,
    schema
  );


  const err = primitiveValidator(data, schema);

  if (err) {
    addError(result, "type", err);
  }
}

function validateRequired(ctx, result, schema, data) {
  let tp = getType(data);
  if (tp === "object") {
    schema.forEach((k) => {
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

function validateArray(ctx, result, schema, data) {
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

const inferCodedValueDataType = (data) => {
  if (getType(data) === "string") {
    return "code";
  } else if (getType(data) === "object" && !data.coding && !data.text) {
    return "Coding";
  } else if ((getType(data) === "object" && data.coding) || data.text) {
    return "CodeableConcept";
  }
};

const buildTerminologyValidationRequestPayload = (
  binding,
  codedValueType,
  data,
) => {
  if (codedValueType === "code") {
    return {
      resourceType: "Parameters",
      parameter: [
        { name: "url", valueUri: binding.valueSet },
        { name: "inferSystem", valueBoolean: true },
        { name: "code", valueCode: data },
      ],
    };
  }
  if (codedValueType === "Coding") {
    return {
      resourceType: "Parameters",
      parameter: [
        { name: "url", valueUri: binding.valueSet },
        { name: "coding", valueCoding: data },
      ],
    };
  }
  if (codedValueType === "CodeableConcept") {
    return {
      resourceType: "Parameters",
      parameter: [
        { name: "url", valueUri: binding.valueSet },
        { name: "codeableConcept", valueCodeableConcept: data },
      ],
    };
  }
};

function validateBinding(ctx, result, schema, data) {
  const binding = schema.binding;
  const dataType = schema.type || inferCodedValueDataType(data);

  const responseParameters = ctx.terminiologyResolver(
    buildTerminologyValidationRequestPayload(binding, dataType, data),
  );
  const isValid = responseParameters?.parameter.find(
    (param) => param.name === "result",
  ).valueBoolean;
  if (!isValid) {
    addError(result, "terminology-binding", {
      binding: binding,
      message: `Provided coded value ${formatValue(data)} does not pass validation against the following valueset: ${formatValue(binding.valueSet)}`,
    });
  }
}

function validateChoices(ctx, result, schema, data) {
  let item = result.path[result.path.length - 1];
  if(! schema.some((x)=> { return item == x })) {
    addError(result, "choice-excluded", `${item} is excluded choice`);
  }
}

// handle extensions here
function validateSlices(ctx, result, schemas, data) {
  Object.values(schemas)
    .filter(({ slicing }) => !!slicing)
    .forEach((schema) => {
      const counters = {};

      data.forEach((dataelm, i) => {
        each(schema.slicing.slices, (sliceName, sliceDef) => {
          if (_.isMatch(dataelm, sliceDef.match.value)) {
            counters[sliceName] = (counters[sliceName] || 0) + 1;
            if (sliceDef.schema) {
              result.path.push(i);

              const newSchemas = {};
              Object.assign(newSchemas, schemas);
              addSchemasToSet(ctx, newSchemas, sliceDef.schema, sliceName);
              // console.log('validate-slice',  JSON.stringify(dataelm), Object.keys(newSchemas))
              validateSchemas(ctx, result, newSchemas, dataelm);
              result.path.pop();
            }
          }
        });
      });

      each(schema.slicing.slices, (sliceName, sliceDef) => {
        const { min, max } = sliceDef;
        const found = counters[sliceName] || 0;

        if (min && found < min) {
          addError(
            result,
            "slice-cardinality",
            `Slice defines the following min cardinality: ${formatValue(min)}, actual cardinality: ${formatValue(found)}`,
          );
        }

        if (max && found > max) {
          addError(
            result,
            "slice-cardinality",
            `Slice defines the following max cardinality: ${formatValue(max)}, actual cardinality: ${formatValue(found)}`,
          );
        }
      });
    });
}



let VALIDATORS = {
  fixed:       validateFixed,
  pattern:     validatePattern,
  constraints: validateConstraints,
  required:    validateRequired,
  excluded:    validateExcluded,
  binding:     validateBinding,
  elements:    validateElements,
  choices:     validateChoices,
  // array:       validateArray,
};

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
    throw new Error("could not resolve [" + JSON.stringify(schemaName) + "]");
  }
}

function resolveSchemaFromUrl(ctx, schemaName, path) {
  let sch = ctx.schemaResolver(schemaName);
  if (sch) {
    return sch;
  }
  // NOTE: do not resolve url on the first level of extention ONLY
  // else {
  //   throw new Error(
  //     `could not resolve ${formatValue(schemaName)} from ${formatValue([...path, "url"])}`,
  //   );
  // }
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

function isReferenceOnResource(ref) {
  return ref === "Resource";
}

function addSchemasToSet(ctx, set, schema, schemaName) {
  schema.name ||= schemaName;
  if (schema) {
    if (schema.base && !set[schema.base]) {
      let sch = resolveSchema(ctx, schema.base);
      if(sch){
        addSchemasToSet(ctx, set, sch, schema.base);
      } else {
        console.assert(false, `Schema ${name} is not found`)
      }
    }
    if (schema.type && !set[schema.type] && schema.kind !== "primitive-type") {
      let sch = resolveSchema(ctx, schema.type);
      if (sch) {
        addSchemasToSet(ctx, set, sch,  schema.type);
      } else {
        console.assert(false, `Schema ${name} is not found`)
      }
    }

    if( schema.name ){
      set[schema.name] = schema;
    } else {
      console.assert(false, "There is no name for schema", schema)
    }
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


const IGNORE = {
  "kind": true,
  "name": true,
  "type": true,
  "array": true,
  "base": true,
  "slicing": true,
  "extensions": true
}

function evalValidators(ctx, result, schemas, data) {
  // basic keyword validators
  each(schemas, (schk, sch) => {
    each(sch, (key,subsch)=>{
      let validator = VALIDATORS[key]
      if (validator){
        validator(ctx, result, subsch, data)
      } else {
        if(!IGNORE[key] && !ARRAY_VALIDATORS[key]) {
          console.log(`No validator for ${key}`)
        }
      }
    })
  });
}

function collectSchemasForElement(ctx, elset, schemas, evalCtx, k) {

  // extensions
  if(k == 'extension') {
    let slicing = {slices: {}}
    each(schemas, (schemaPath,schema)=> {
      if(schema.extensions){
        each(schema.extensions,(extName, ext)=>{
          let extSch = resolveSchema(ctx, ext.url)
          if(!extSch) { console.log('could not resolve ', ext.url) }
          let sch = Object.assign({}, ext)
          delete sch.min;
          delete sch.max;
          delete sch.url;
          slicing.slices[extName] = {
            match: {
              type: 'pattern',
              value: {url: ext.url}
            },
            max: ext.max,
            min: ext.min,
            schema: Object.assign(sch,extSch)
          }
        })
      }
    })
    // console.log('slicing', slicing)
    addSchemasToSet(ctx, elset, {slicing: slicing}, 'extension');
  }

  let choiceOf = null;
  each(schemas, (schk, sch) => {
    let subsch = sch?.elements?.[k];

    if (subsch && ! subsch.choices ) {
      subsch.name = sch.name + "." + k; // TODO FIXME
      addSchemasToSet(ctx, elset, subsch);
    }
    if(subsch && subsch.choiceOf) {
      choiceOf = subsch.choiceOf
      evalCtx.multiChoice[choiceOf] ||= []
      evalCtx.multiChoice[choiceOf].push(k)
    }
  });

  // if we found choiceOf - we have to collect all choice branches from all schemas
  if(choiceOf){
    each(schemas, (nm, sch)=>{
      let choicesch = sch?.elements?.[choiceOf]
      if(choicesch){
        choicesch.name = sch.name + "." + k; // TODO FIXME
        addSchemasToSet(ctx, elset, choicesch);
      }
    })
  }
}

function isElementArray(elset) {
  return Object.keys(elset).some((nm)=>{
    let sch = elset[nm]
    if(sch.array){
      return  true
    }
  })
}

function validateArrayType(result, elset, k, v) {
  if(isElementArray(elset)){
    if(! Array.isArray(v)){
      addError(result, "not-array", `${k} is not array`);
    }
  } else {
    if(Array.isArray(v)){
      addError(result, "not-singular", `${k} is not singular`);
    }
  }
}

function isEmpty(elset) {
  return Object.keys(elset).length === 0
}

function evalElement(ctx, result, schemas, evalCtx, k, v) {
  let elset = set();

  collectSchemasForElement(ctx, elset, schemas, evalCtx, k)

  if (isEmpty(elset)) {
    addError(result, "unknown-element", `${k} is unknown`);
    return;
  }

  validateArrayType(result, elset, k, v)

  if (Array.isArray(v)) {
    validateSchemasArray(ctx, result, elset, v);
    validateSlices(ctx, result, elset, v);

    v.forEach((x, i) => {
      result.path.push(i);
      validateSchemas(ctx, result, elset, x);
      result.path.pop();
    });
  } else {
    validateSchemas(ctx, result, elset, v);
  }
}

function postValidate(ctx, result, evalCtx) {
  each(evalCtx.multiChoice, (ch, chs)=>{
    if(chs.length > 1){
      result.path.push(ch);
      addError(
        result,
        "choice",
        `only one choice for ${ch} allowed, but multiple found: ${chs.join(', ')}`,
      );
      result.path.pop(ch);
    }
  });
}

function validateSchemas(ctx, result, schemas, data) {

  evalValidators(ctx, result, schemas, data)

  if (!isMap(data)) { return }

  let evalCtx = { multiChoice: {} };

  // this is not enough because if there is extension or slices - data may be absent
  // but we have to validate - probably we should use the postValidate for that
  each(data, (k, v) => {
    result.path.push(k);
    evalElement(ctx, result, schemas, evalCtx, k, v)
    result.path.pop();
  });

  postValidate(ctx, result, evalCtx)
}

export function validate(ctx, schemaNames, data) {
  let schset = set();
  let result = { root: true, errors: [], path: [data?.resourceType] };
  if(data.resourceType){
    addSchemasToSet(ctx, schset, resolveSchema(ctx, data.resourceType), data.resourceType);
  }
  schemaNames.forEach((x) => {
    addSchemasToSet(ctx, schset, resolveSchema(ctx, x), x);
  });
  validateSchemas(ctx, result, schset, data);
  return { errors: result.errors };
}

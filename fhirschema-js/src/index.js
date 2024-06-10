function addError(result, type, message) {
  result.errors.push({type: type, path: result.path.join('.'), message: message})
}

function getType(input) {
  const type = Object.prototype.toString.call(input);
  switch (type) {
  case '[object Array]':
    return 'array';
  case '[object Object]':
    return 'object';
  case '[object String]':
    return 'string';
  case '[object Number]':
    return 'number';
  case '[object Boolean]':
    return 'boolean';
  case '[object Null]':
    return 'null';
  case '[object Undefined]':
    return 'null';
  case '[object Date]':
    return 'date';
  default:
    return 'unknown';
  }
}

function isPrimitive(tp){
  return tp.toLowerCase() === tp
}

function validateType(ctx, result, schema, data) {
  if(isPrimitive(schema)) {
    let tp = getType(data)
    if( tp != schema){
      addError(result, 'type', `expected ${schema}, got ${tp}`)
    }
  }
}

function validateRequired(ctx, result, schema, data) {
  let tp = getType(data)
  if( tp == 'object'){
    schema.forEach((k)=>{
      result.path.push(k)
      if(data[k] === undefined){
        addError(result, 'required', `${k} is required`)
      }
      result.path.pop()
    })
  } else {
    addError(result, 'type', `expected object got ${tp}`)
  }
}

function ensureArray(data) {
  let tp = getType(data)
  if( tp !== 'array'){
    addError(result, 'type', `expected array got ${tp}`)
    return true
  }
}

function validateMax(ctx, result, schema, data) {
  if(ensureArray(data)) { return }
  if(data.length > schema) {
    addError(result, 'max', `expected ${schema} < ${data.length}`)
  }
}

function validateMin(ctx, result, schema, data) {
  if(ensureArray(data)) { return }
  if(data.length < schema) {
    addError(result, 'min', `expected ${schema} > ${data.length}`)
  }
}

function validateArray(ctx, result, schema, data) {
  if(!Array.isArray(data)){
    addError(result, 'not-array', 'expected array')
  }
}

function validateElements(ctx, result, schema, data) {
  let type = getType(data)
  if( type !== 'object'){
    addError(result, 'type', `expected object, got ${type}`)
  }
}

function isMap(x){
  return x.constructor == {}.constructor
}

// array and type should work together

let VALIDATORS = {
  'required': validateRequired,
  'type': validateType,
  'elements': validateElements,
}

let ARRAY_VALIDATORS = {
  'array': validateArray,
  'max': validateMax,
  'min': validateMin
}

function resolveSchema(ctx, schemaName){
  let sch = ctx[schemaName];
  if(sch){
    sch.name = schemaName;
    return sch;
  } else {
    throw new Error('could not resolve [' + schemaName + ']')
  }
}

function resolveType(ctx, schemaName){
  if(isPrimitive(schemaName)) {return}
  let sch = ctx[schemaName];
  if(sch){
    sch.name = schemaName;
    return sch;
  } else {
    throw new Error('could not resolve [' + schemaName + ']')
  }
}

function set() {
  return {}
}

function each(obj, f){
  for(var k in obj){
    var v = obj[k];
    f(k, v)
  }
}


function addSchemaToSet(ctx, set, schema){
  if(schema) {
    if(schema.base && !set[schema.base]){
      addSchemaToSet(ctx, set, resolveSchema(ctx, schema.base))
    }
    if(schema.type && !set[schema.type]){
      let tp = resolveType(ctx, schema.type)
      if(tp) {
        addSchemaToSet(ctx, set, tp)
      }
    }
    set[schema.name] = schema
  }
}

function validateSchemasArray(ctx, result, schemas, data){
  each(schemas, (schk, sch)=>{
    each(sch, (k, val)=>{
      let validator=ARRAY_VALIDATORS[k];
      if(validator){
        validator(ctx,result, val, data)
      }
    })
  })
}


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

function validateSchemas(ctx, result, schemas, data){
  each(schemas, (schk, sch)=>{
    each(sch, (k, val)=>{
      let validator=VALIDATORS[k];
      if(validator){
        validator(ctx,result, val, data)
      }
    })
  })
  if(isMap(data)) {
    each(data, (k,v)=>{
      if(result.root && k == 'resourceType'){
        result.root = false;
      } else {
        let elset = set()
        result.path.push(k)
        each(schemas, (schk, sch)=>{
          let subsch = (sch?.elements || {})[k]
          if(subsch){
            subsch.name = sch.name + '.' + k
            addSchemaToSet(ctx, elset, subsch)
          }
        })
          if(Object.keys(elset).length === 0){
            addError(result, 'unknown-element', `${k} is unknown`)
          } else {
            if(Array.isArray(v)){
              validateSchemasArray(ctx,result,elset,v)
              v.forEach((x,i)=>{
                result.path.push(i)
                validateSchemas(ctx, result, elset, x)
                result.path.pop()
              })
            } else {
              validateSchemas(ctx, result, elset, v)
            }
          }
        result.path.pop()
      }
    })
  }
}

export function validate(ctx, schemaNames, data) {
  let schset = set()
  let result = {root: true, errors: [], path: [data.resourceType]};
  schemaNames.forEach((x)=>{
    addSchemaToSet(ctx, schset, resolveSchema(ctx,x));
  })
  validateSchemas(ctx,result, schset, data)
  return {errors: result.errors}
}


let ctx = {
  resource: {
    required: ['id'],
    elements: {id: {type: 'string'}}
  },
  HumanName: {
    elements: {
      family: {type: 'string'},
      given:  {type: 'string', array: true},
    }
  },
  patient: {
    base: 'resource',
    required: ['birthDate'],
    elements: {
      name: {array: true, type: 'HumanName'}
    }
  },
  'string': {},
  'us-patient': {
    base: 'patient',
    require: ['name'],
    elements: {name: {min: 1}}
  },
};


// console.log(validate(ctx, ['patient'], {id: 'pt1', name: [{family: 'ryz', given: [1], extra: 'ups'}, 1], ups: 'ups'}))


function validateRequire(ctx, result, schema, data) {
  console.log('  require', schema, JSON.stringify(data))
}

function validateType(ctx, result, schema, data) {
  console.log('  type', schema, JSON.stringify(data))
}

function validateMax(ctx, result, schema, data) {
  console.log('   max', schema, JSON.stringify(data))
}

function validateMin(ctx, result, schema, data) {
  console.log('  min', schema, JSON.stringify(data))
}

function validateArray(ctx, result, schema, data) {
  if(!Array.isArray(data)){
    result.errors.push({type: 'not-array', path: result.path.join('.')})
  }
}

function isMap(x){
  return x.constructor == {}.constructor
}

// array and type should work together

let VALIDATORS = {
  'require': validateRequire,
  'type': validateType,
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

function validateSchemas(ctx, result, schemas, data){
  console.log('>', Object.keys(schemas).join(', '), '|||', result.path.join('.') )
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
        result.errors.push({type: 'unknown-element', path: '.' + result.path.join('.'), message: `${k} unknown`})
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
    })
  }
}

export function validate(ctx, schemaNames, data) {
  let schset = set()
  let result = {errors: [], path: []};
  schemaNames.forEach((x)=>{
    addSchemaToSet(ctx, schset, resolveSchema(ctx,x));
  })
  validateSchemas(ctx,result, schset, data)
  return result
}

// validate(schemas, data)
// each schemas s
//    each s.keyword
//       validate_keyword(data)
// each data (k, v)=>
//   el-schs = schemas_for_key(k)
//   if el-schs empty => error(unkown key)
//   if array(v)
//      validateArray(el-schs, v)
//      each v
//        validate(el-schs, v)
//   else
//      validate(el-schs, v)

let ctx = {
  resource: {
    require: ['id'],
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

// console.log(Object.keys({}).length)

console.log(validate(ctx, ['patient'], {id: 'pt1', name: [{family: 'ryz', given: ['nik']}], ups: 'ups'}))

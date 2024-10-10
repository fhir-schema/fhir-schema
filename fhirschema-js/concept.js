function validate_elements(ctx, schema, schemas, data) {
  console.log(`Validating elements with schema ${schema} and data ${data}`);
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      console.log(`Key: ${key}, Value: ${data[key]}`);
      var subschema = schema[key];
    }
  }
}

var VALIDATORS = {
  elements: { validator: validate_elements },
};

function validateKeyword(ctx, keyword, schema, schemas, data) {
  console.log(
    `Validating keyword ${keyword} with schema ${schema} and data ${data}`,
  );
}

function postValidateKeyword(ctx, keyword, schemas, data) {
  console.log(
    `Post validating keyword ${keyword} with schemas ${schemas} and data ${data}`,
  );
}

function postValidateData(ctx, schemas, data) {
  console.log(`Post validating data with schemas ${schemas} and data ${data}`);
}

function validate(ctx, schemas, data) {
  var ks = {};
  schemas.forEach((sch) => {
    Object.keys(sch).forEach((kw) => {
      keys[kw] ||= [];
      keys[kw].push(sch);
      validateKeyword(ctx, kw, sch, schemas, data);
    });
  });
  ks.forEach((kw, schms) => {
    postValidateKeyword(ctx, kw, schms, data);
  });
  postValidateData(ctx, schemas, data);
}

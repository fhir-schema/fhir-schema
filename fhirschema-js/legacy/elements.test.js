import { describe, expect, test } from "bun:test";
import { validate } from "../src/index.js";

const createSchemaResolver = (store) => (url, _opts) => store[url];

let valid = { errors: [] };

let schemas = {
  string: {
    kind: "primitive-type"
  },
  HumanName: {
    elements: {
      given:  {type: "string", array: true},
      family: {type: "string"},
      nested: {
        elements: { element: {type: "string"}}
      }
    }
  },
  Patient: {
    elements: {
      resourceType: { type: "string" },
      status: { type: "string" },
      multielement: {
        type: "string",
        array: true
      },
      multielementObject: {
        array: true,
        elements: {
          element: {type: "string"}
        }
      },
      name:   { type: "HumanName" },
      nested: {
        elements: {
          element: {type: 'string'},
          nestedTwice: {
            elements: {
              element: {type: 'string'}
            }
          }
        }
      }
    }
  }
};

let tests = {
  schemas: schemas,
  desc: 'test elements and arrays',
  tests: [
    {
      desc: 'basic element',
      data: {resourceType: 'Patient', status: 'active'}
    },
    {
      desc: 'unknown element',
      data: {
        resourceType: 'Patient',
        unknown: 'value'
      },
      errors: [{
        message: "unknown is unknown",
        type: "unknown-element",
        path:"Patient.unknown"
      }]
    },
    {
      desc: 'nested element',
      data: {
        resourceType: 'Patient',
        nested: {element: 'value'}
      }
    },
    {
      desc: 'nested unknown element',
      data: {
        resourceType: 'Patient',
        nested: {unknown: 'not-ok'}
      },
      errors: [{
        message: "unknown is unknown",
        path: "Patient.nested.unknown",
        type: "unknown-element"
      }]
    },
    {
      desc: 'nested  twice element',
      data: {
        resourceType: 'Patient',
        nested: {nestedTwice: {element: 'ok'}}
      }
    },
    {
      desc: 'nested  twice unknown element',
      data: {
        resourceType: 'Patient',
        nested: {nestedTwice: {unknown: 'not-ok'}}
      },
      errors: [{
        message: "unknown is unknown",
        path: "Patient.nested.nestedTwice.unknown",
        type: "unknown-element"
      }]
    },
    {
      desc: 'complex type',
      data: {
        resourceType: 'Patient',
        name: {family: 'ok'}
      }
    },
    {
      desc: 'complex type unknown',
      data: {
        resourceType: 'Patient',
        name: {unknown: 'not-ok'}
      },
      errors: [
        {
          message: "unknown is unknown",
          path: "Patient.name.unknown",
          type: "unknown-element"
        }
      ]
    },
    {
      desc: 'complex type nested element',
      data: {
        resourceType: 'Patient',
        name: {nested: {element: 'ok'}}
      }
    },
    {
      desc: 'complex type nested unknown',
      data: {
        resourceType: 'Patient',
        name: {nested: {unknown: 'not-ok'}}
      },
      errors: [
        {
          message: "unknown is unknown",
          path: "Patient.name.nested.unknown",
          type: "unknown-element"
        }
      ]
    },
    {
      desc: 'array',
      data: {
        resourceType: 'Patient',
        multielement: ['a', 'b']
      }
    },
    {
      desc: 'not array',
      data: {
        resourceType: 'Patient',
        multielement: 'a'
      },
      errors: [{
        message: "multielement is not array",
        path: "Patient.multielement",
        type: "not-array",
      }]
    },
    {
      desc: 'singular is array',
      data: {resourceType: 'Patient', status: ['active']},
      errors: [
        {
          message: "status is not singular",
          path: "Patient.status",
          type: "not-singular",
        }
      ]
    },
    {
      desc: 'array object',
      data: {
        resourceType: 'Patient',
        multielementObject: [
          {element: 'a'},
          {element: 'b'}
        ]
      }
    },
    {
      desc: 'not array object',
      data: {
        resourceType: 'Patient',
        multielementObject: {element: 'a'}
      },
      errors: [
        {
          message: "multielementObject is not array",
          path: "Patient.multielementObject",
          type: "not-array",
        }
      ]
    },
    {
      desc: 'complex type wrong not-array',
      data: {
        resourceType: 'Patient',
        name: {given: 'ok'}
      },
      errors: [{
        message: "given is not array",
        path: "Patient.name.given",
        type: "not-array",
      }]
    },
    {
      desc: 'complex type wrong array',
      data: {
        resourceType: 'Patient',
        name: {family: ['ok']}
      },
      errors: [{
        message: "family is not singular",
        path: "Patient.name.family",
        type: "not-singular",
      }]
    },
  ]
}


describe("basic elements", () => {

  let resolver = (url)=>{ return tests.schemas[url] }
  const ctx = { schemaResolver: resolver }

  tests.tests.forEach((tst)=>{
    let run = tests.focus ? tst.focus : true
    if(!run) return
    test(tst.desc, ()=> {
      let res = validate(ctx, tst.schemas || [], tst.data)
      if(tst.errors){
        expect(res.errors).toEqual(tst.errors)
      } else {
        expect(res.errors).toEqual([])
      }
    })
  })

});

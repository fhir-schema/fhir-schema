import { expect, test , describe, beforeAll, afterAll} from "bun:test";
import { validate } from '../src/index.js'


let resource = {
  name: 'Resource',
  elements: {
    id: {
      type: 'string'
    }
  }
}

let patient = {
  name: 'Patient',
  base: 'Resource',
  elements: {
    name: {
      type: 'string'
    }
  }
}


let ctx = {'Resource': resource, 'Patient': patient}

test("elements", () => {
  expect(validate(ctx, {}, {}))
    .toEqual([])

  expect(validate(ctx, ['Resource'], {ups: 'ups'}))
    .toEqual({errors: [{type: 'extra-element'}]})

  expect(validate(ctx, ['Resource'], {name: 1}))
    .toEqual({errors: [{type: 'type'}]})

});

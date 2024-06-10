import { expect, test , describe, beforeAll, afterAll} from "bun:test";
import { validate } from '../src/index.js'

let ctx = {
  Resource: {
    name: 'Resource',
    elements: {
      id: {
        type: 'string'
      }
    }
  }
}

let valid = {errors: []}
test("elements", () => {

  expect(validate(ctx, ['Resource'], {resourceType: 'Patient', id: 'r1'}))
    .toEqual(valid)

  expect(validate(ctx, ['Resource'], {resourceType: 'Patient', id: 1}))
    .toEqual({
      errors: [{
        message: "expected string, got number",
        path: "Patient.id",
        type: "type",
      }]
    })

  expect(validate(ctx, ['Resource'], {resourceType: 'Patient', name: [{family: 'Smith'}]}))
    .toEqual({
      errors: [
        {
          message: "name is unknown",
          path: "Patient.name",
          type: "unknown-element",
        }
      ]
    })

});

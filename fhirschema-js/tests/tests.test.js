import { describe, expect, test } from "bun:test";
import { validate } from "../src/index.js";


const cases = [
  require("../../tests/1_elements.json"),
  require("../../tests/2_base.json"),
  require("../../tests/3_choices.json"),
  require("../../tests/4_required.json"),
  require("../../tests/5_slices.json"),
  // require("../../tests/6_extensions.json"),
]

const cases_ = [
  // require("../../tests/5_slices.json"),
  // require("../../tests/6_extensions.json"),
  require("../../tests/3_choices.json"),
]

cases.forEach((tcase)=>{
  let resolver = (url)=>{ return tcase.schemas[url] }
  let ctx = { schemaResolver: resolver }
  let desc = tcase.desc
  describe(desc, ()=>{
    tcase.tests.forEach((tst)=>{
      let run = tcase.focus ? tst.focus : true
      if(!run) return
      test(tst.desc || JSON.stringify(tst.data), ()=> {

        let res = validate(ctx, tst.schemas || [], tst.data)
        if(tst.errors){
          expect(res.errors).toEqual(tst.errors)
        } else {
          expect(res.errors).toEqual([])
        }
      })
    })
  })
})

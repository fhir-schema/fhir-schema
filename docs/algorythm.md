# Keywords

* base - add schema to context
* type
  * in case of complex type - add schema to context
  * for primitive type - validate value
* pattern - validate value by pattern
* constraints - FHIRPath constraints
* bindings - check valueset bindings (using effects/deffered)
* fixed - check that value is equal to fixed value
* object
  * extensions - define and constraint extensions
  * required - required keys, interesting idea by gpt - allow to use fhirpath expressions in required
  * excluded - excluded keys
  * elements - list elements and  their properties
  * choices - union types
* collection
  * array - test that value is array
  * min/max - check min and max number items in colleciton
  * slices


only `slices` and `elements` need cooperative validation

collection group should be evaled on the whole collection,
but others should be evaled on each element


## Algorithm flow

There is no arrays of arrays in FHIR!

1. we start with context, set of schemas and data
2. for every schema in initial context (we need this for keywords like type and base, which add schema to context)
    1. for every keyword we call populate_context()
3. for every schema in context
  * for every keyword we call validate_keyword()
4. if data is object
  * for every key in data
    * if key == 'extension': validate_extensions(ctx, data.extension) recur
    * collect schemas from elements (ctx.schemas = schemas)
    * if no schemas found and no "open" or "map" - add_error(ctx, "unknown key") recur
    if data[key] is array
      * call validate_array(ctx,data[key]) // slices validation will be here
      for each element in data[key]
        * call validate(ctx, element)
    else validate(ctx, data[key])


Most of keywords just pure validate functions.
Walk throuth the data and schemas is hardcoded in the algorithm of elements -
which handles extensions, arrays and extra elements.

## validate_array(ctx, data)

1. for schema in ctx.schemas
  * for every keyword which is applicable to array (min, max)
    * call validate_array_keyword(ctx, schema, data)
  * here we have to handle slices
      * collect slices into the groups
      * pupulate slice and run validation in a slice



## Slicing

we should group slices  for different branches of profiles - only if there is "else" slice

# DRAFT Validation Algorithm

1. Collect initial schema set:
* Get schema from resourceType
* Get schemas from meta.profile
* Get external schemas passed to validator

For the following patient resource:
```json
{
  "resourceType": "Patient",
  "id": "some-patient-1",
  "meta": {
    "profile": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"
    ]
  },
  "name": [{
    "family": "Smith",
    "given": ["John"]
  }]
}
```

The following initial schema-set is built:

```json
["Base" "Resource" "DomainResource" "Patient" "us-core-patient"]
```

2. Iterate over collected schema set to check top-level rules:
* Check `required` and `excluded` directives
* Check `poly-roots` directive
  * Type mutual exclusiveness check
  * Check that selected type is contained in `choices`
* Evaluate fhirpath constraints

3. Start iteration over input data to obtain key-value pairs:
* For each obtained key, iterate over the schema set and obtain sub-schemas for this key

For the following patient resource and key `name`:

```json
{
  "resourceType": "Patient",
  "id": "some-patient-1",
  "meta": {
    "profile": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"
    ]
  },
  "name": [{
    "family": "Smith",
    "given": ["John"]
  }]
}
```

The following set of sub-schemas will be obtained:

```json
["Element" "HumanName"]
```

* If no schema is found, raise an `unknown-key` error
* Do pre-recursive-descent checks:
  * Check shape - `array` or `scalar`
  * If `array` - check `cardinality` and `slicings`
* Perform recursive call with new value and sub-schemas set.
Preserve current `path` in data, preserve current `path` in schema, and preserve from which schema the recursive hop was made.

  3.1 Primitive extensions processing:
    * If key starts with _, try to find a key with an actual value (same key, but without _) and build a value wrapper
that holds the Element sub-part (id, extension). The resulting wrapper contains value, sub-schemas, and Element sub-part (id, extension)
    * If key doesn't start with _, try to find the _ sub-part for this key and build a value wrapper
    * Perform a check that a primitive extension is added for a primitive value, not a complex one

4. Slicing processing (Mark/Sweep like)
* Iterate over sub-schemas and obtain `slicing` directive, which describes slices and their match directives.
* Mark every collection element with slices that are matched against it.
Some slices (such as constraining slices) may not contain match directives; we process them during the `sweep` phase.
* Do `sweep`, find remaining unprocessed slices and check if they are valid (constraining slices), do cardinality checks, process @default slice.

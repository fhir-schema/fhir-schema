# Element

_Element_ is a FHIR Schema component which defines or constrains FHIR data type.

## Syntax
All properties are optional.

*[Shape](#shape)* properties
- `array` (boolean)
- `scalar` (boolean)
  

*[Cardinality](#cardinality)* properties
- `min` (integer)
- `max` (integer)


*[Choice type](#choice-type)* properties
- `choiceOf` (string)
- `choices` (array of strings)


*[Requires and exclusions](#requires-and-exclusions)* properties
- `excluded` (array of strings)
- `required` (array of strings)


*[Type reference](#type-reference)* properties
- `elementReference` (array of strings)
- `type` (string)


*[Nested elements](#nested-elements)* property
- `elements` (object)


*[Constraints](constraint.md)* property
- `constraints` (Constraint)


*[Slicing](slicing.md)* property
- `slicing` (Slicing)


*[Pattern matching (constants definition)](#pattern-matching)* property
- `fixed` (any)
- `pattern` (any)


*[Terminology binding](#terminology-binding)* property
- `binding` (Binding): valueset binding\


*[Reference target](#reference-target)* property
- `refers` (array of strings)

_[Informational](#informational)_ properties
- `modifier` (boolean)
- `mustSupport` (boolean)
- `summary` (boolean)

## Shape
There are 2 properties controlling element shape:
- `array`
- `scalar`

The `array` and `scalar` properties control element structure. These 2 properties are **mutually exclusive**.
I.e. the folowing element is invalid.
```yaml
array: true
scalar: true
```

- If `array` is set, only JSON arrays are accepted.
- If `scalar` is set, JSON arrays are rejected.
- If neither is set, everything is accepted.

Empty arrays are rejected (they are not allowed by FHIR).

### Example
Consider this part of FHIR R4 Core Patient schema:
```yaml
{{#include examples/patient-shape.yaml}}
```

Resource example that conforms to schema mentioned earlier:
```yaml
{{#include examples/patient-resource-shape.yaml}}
```

Resource example that didn't conform to schema mentioned earlier
```yaml
{{#include examples/invalid-patient-resource-shape.yaml}}
```

## Cardinality
There are 2 properties controlling element cardinality:
- `min`
- `max`

Cardinality defines minimum and maximum number of array element.
Cardinality properties are allowed only if `array` is set.

Absent cardinality property means this cardinality is not restricted.

### Example
Schema
```yaml
elements:
  array:
    type: string
    min: 2
    max: 3
```

Valid resources
```yaml
array:
  - a
  - b
  - c
---
array:
  - a
  - b
```
Invalid resources:
```yaml
array:
  - a
---
array:
  - a
  - b
  - c
  - d
```

## Choice type
There are 2 properties controlling polymorphism:
- `choiceOf`
- `choices`

In FHIR polymorhpic types are used to allow values of different types, for instance
```yaml
valueString: abc
---
valueCode: some-code
---
valueCoding:
  system: some-system
  value: some-value
```

In this example `value` is the name of a polymorphic type, in FHIR it is denoted as `value[x]`;
`valueString`, `valueCode` are names of concrete polymorphic fields.

To represent this, polymorhpic type element lists all concrete polymorphic types
under the `choices` property.

Vice versa every concrete polymorphic type element specifies it polymorphic name under the `choiceOf` property.

### Example
Schema
```yaml
elements:
  smth:
    choices: [smthString, smthCode]
  smthCode:
    type: code
    choiceOf: smth
  smthString:
    type: string
    choiceOf: smth
```

Valid resources:
```yaml
smthCode: some-code
---
smthString: abc
```

Invalid resources:
```yaml
smthCode: some-code
smthString: abc
---
smthMarkdown: abc
---
smth: abc
```

## Requires and exclusions
There are 2 elements controlling required and excluded elements:
- `required`
- `excluded`

The `required` property lists all subelements which shall be present.
The `excluded` property lists all subelements which shall be absent.

### Example
Schema
```yaml
required: [a]
excluded: [b]
elements:
  a:
    type: string
  b:
    type: string 
  c: type: string
```

Valid resources
```yaml
a: abc
---
a: abc
c: abc
```

Invalid resources
```yaml
c: abc
---
b: abc
---
a: abc
b: abc
```

## Type reference
There are 2 properties specifying type references:
- `type`
- `elementReference`

These two proeprties are mutually exclusive.

Type reference is either a FHIR type name or canonical URL of the FHIR type.

### Base type

The `type` property specified base type of the element.
Data is accepted if both conditions are met:
- Data is accepted when validated against referred type
- Data is accepted by all other conditions on element

### Example
Schema
```yaml
elements:
  a:
    type: string
    array: true
    max: 1
  b:
    type: http://hl7.org/fhir/StructureDefinition/string
    array: true
    max: 1
```

Valid resources
```yaml
a:
  - abc
---
b:
  - abc
```

Invalid resources
```yaml
a:
  - abc
  - def
---
b:
  - abc
  - def
---
a:
  - 1
---
b:
  - 1
```

### Element reference syntax

Element reference is an array of the following format:
- First element is a type reference
- Other elements are a path in FHIRSchema

### Example
Schema
```yaml
url: http://example.org/abc
elements:
  a:
    elements:
      b:
        type: string
```

Element reference referring the `b` element
```yaml
[http://example.org/abc, elements, a, elements, b]
```

### Element reference

Data is accepted if both conditions are met:
- Data is accepted when validated against schema for referred element
- Data is accepted by all other conditions on element

Element reference is useful for defining recursive structures (e.g. `Questionnaire.item`)

### Example
Schema
```yaml
url: http://example.org/abc
elements:
  a:
    elements:
      b:
        type: string
      a:
        elementReference: [http://example.org/abc, elements, a]
```

Valid resources:
```yaml
a:
  b: abc
---
a:
  a:
    b: abc
  b: abc
---
a:
  a:
    a:
      a:
        b: abc
```

Invalid resources:
```yaml
a:
  a: abc
  c: abc
---
a:
  a:
    a:
      c: abc
```

## Nested elements
The `elements` property define subelement constraints.
Syntactically it is an object, with string keys and Element values.
Semantically it defines behavior of the corresponding fields in data.

### Example
Schema
```yaml
elements:
  a:
    type: string
  b:
    c:
      type: string
```

Valid resources
```yaml
a: abc
---
a: abc
b:
  c: abc
---
b:
  c: abc
```

Invalid resources
```yaml
a: 1
---
b:
  a: abc
---
b:
  c: 1
```

## Terminology binding
Syntax
- `valueSet` (string)
- `strength` (string)

FHIRSchema terminology binding follows FHIR terminology binding.
Both `valueSet` and `strength` properties shall be specified.

The `valueSet` property is a canonical URL referring the ValueSet
to which the codes in the data element value are bound.
The `strength` property specifies FHIR ValueSet binding strength.
Only `required` bindings are validated.

### Example
Schema

```yaml
{{#include examples/patient-binding.yaml}}
```

> Note: there is a `codesystems` property in expanded view of the example schema:
> it is a technical field generated by StructureDefinition to FHIRSchema conversion,
> this field speeds up schema loading, but is irrelevant to writing new schemas.

Valid resource:
```yaml
~resourceType: Patient
gender: other
```

Invalid resource:
```yaml
~resourceType: Patient
gender: something-not-in-the-valueset
```

### Reference target
The `refers` property lists allowed reference targets.
A reference data element is accepted only if it refers to one of the allowed here types.
A target can be either resource type or canonical URL for this resource type.

Example Schema:
```yaml
{{#include examples/patient-reference.yaml}}
```

Valid resources:
```yaml
~resourceType: Patient
generalPractitioner:
  - reference: Organization/organization-1
---
~resourceType: Patient
generalPractitioner:
  - reference: Practitioner/practitioner-1
  - reference: Organization/organization-1
---
~resourceType: Patient
generalPractitioner:
  - reference: Practitioner/practitioner-1
```

Invalid resources:
```yaml
~resourceType: Patient
generalPractitioner:
  - reference: Patient/patient-1
---
~resourceType: Patient
generalPractitioner:
  - reference: Organization/organization-1
  - reference: Patient/patient-1
```

## Informational
These properties do not affect validation, but they provide additional information about element.

The `modifier` property mirrors the `ElementDefinition.isModifier` FHIR property.
The _modifier_ element changes the interpretation of the resource.

The `mustSupport` property mirrors the `ElementDefinition.mustSupport` FHIR property.
The _mustSupport_ element must be supported by an implementation.

The `summary` property mirrors the `ElementDefinition.isSummary` FHIR property.
The _summary_ element should be included in FHIR Search in summary mode.

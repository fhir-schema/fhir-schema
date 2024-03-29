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

*[Terminology binding](#terminology-binding)* property
- `binding` (Binding): valueset binding\

*[Pattern matching (constants definition)](#pattern-matching)* property
- `fixed` (any)
- `pattern` (any)

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
#### Consider this part of FHIR R4 Core Patient schema:
```yaml
{{#include examples/patient-shape.yaml}}
```

#### Resource example that conforms to schema mentioned earlier:
```yaml
~resourceType: Patient
gender: male
```
```yaml
~resourceType: Patient
name:
  - text: John Smith
```

#### Resource example that didn't conform to schema mentioned earlier
```yaml
~resourceType: Patient
gender:
  - male
```
```yaml
~resourceType: Patient
name:
  text: John Smith
```

## Cardinality
There are 2 properties controlling element cardinality:
- `min`
- `max`

Cardinality defines the minimum and maximum number of elements in an array.
These properties are allowed only if the [shape](#shape) is set to 'array'.


Absent cardinality property means this cardinality is not restricted. 
The schema may contain only `min` or `max` properties, or it may omit both.

### Example
#### Schema
```yaml
~url: http://example.org/StructureDefinition/patient-minmax
~base: http://hl7.org/fhir/StructureDefinition/Patient
~type: Patient
~derivation: constraint
elements:
  name:
    min: 2
    max: 3
```

#### Valid resources
```yaml
~resourceType: Patient
name:
  - text: James
  - text: Mary
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```
```yaml
~resourceType: Patient
name:
  - text: James
  - text: Mary
  - text: Robert
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```
#### Invalid resources:
```yaml
~resourceType: Patient
name:
  - text: James
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```
```yaml
~resourceType: Patient
name:
  - text: James
  - text: Mary
  - text: Robert
  - text: Patricia
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```

## Choice type

In FHIR, polymorphic types are used to allow values of different types for specific fields.

```yaml
~resourceType: Patient
multipleBirthBoolean: true
```

```yaml
~resourceType: Patient
multipleBirthInteger: 2
```

In the example provided above, `multipleBirth[x]` is a choice type element, the value of which can either be of the boolean type (`multipleBirthBoolean`) or the integer type (`multipleBirthInteger`).

The concurrent presence of the `multipleBirthBoolean` field and the `multipleBirthInteger` field in the data is not allowed.

There are 2 properties controlling that polymorphism:
- `choices` 
- `choiceOf`

### choices
This property is intended for the enumeration of available polymorphic type elements.

#### Example

```yaml
~url: http://example.org/StructureDefinition/patient-choice-type
~base: http://hl7.org/fhir/StructureDefinition/Patient
~derivation: constraint
elements:
  multipleBirth:
    choices:
      - multipleBirthBoolean
      - multipleBirthInteger
~  multipleBirthBoolean:
~    choiceOf: multipleBirth
~    type: boolean
~  multipleBirthInteger:
~    type: integer
~    choiceOf: multipleBirth
```

### choiceOf

Every concrete polymorphic type element specifies its polymorphic name under the `choiceOf` property.

#### Example

```yaml
~url: http://example.org/StructureDefinition/patient-choice-type
~base: http://hl7.org/fhir/StructureDefinition/Patient
~derivation: constraint
elements:
~  multipleBirth:
~    choices:
~      - multipleBirthBoolean
~      - multipleBirthInteger
  multipleBirthBoolean:
    choiceOf: multipleBirth
    type: boolean
  multipleBirthInteger:
    type: integer
    choiceOf: multipleBirth
```

#### Valid resources:
```yaml
~resourceType: Patient
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-choice-type
multipleBirthBoolean: true
```

```yaml
~resourceType: Patient
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-choice-type
multipleBirthInteger: 3
```

#### Invalid resources:
```yaml
~resourceType: Patient
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-choice-type
multipleBirthBoolean: true
multipleBirthInteger: 3
```
```yaml
~resourceType: Patient
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-choice-type
multipleBirthString: "3"
```
```yaml
~resourceType: Patient
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-choice-type
multipleBirth: true
```
```yaml
~resourceType: Patient
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-choice-type
multipleBirth: 3
```

## Requires and exclusions
There are 2 elements controlling required and excluded elements:
- `required`
- `excluded`

The `required` property lists all subelements which shall be present.
The `excluded` property lists all subelements which shall be absent.

### Example
#### Schema
```yaml
~url: http://example.org/StructureDefinition/patient-minmax
~base: http://hl7.org/fhir/StructureDefinition/Patient
~type: Patient
~derivation: constraint
required:
  - birthDate
excluded:
  - gender
```

#### Valid resources
```yaml
~resourceType: Patient
birthDate: "2000-01-01"
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```
```yaml
~resourceType: Patient
birthDate: "2000-01-01"
active: true
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```

#### Invalid resources
```yaml
~resourceType: Patient
active: true
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```
```yaml
~resourceType: Patient
gender: other
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```
```yaml
~resourceType: Patient
birthDate: "2000-01-01"
gender: other
~meta:
~  profile:
~    - http://example.org/StructureDefinition/patient-minmax
```

## Type reference
There are 2 properties specifying type references:
- `type`
- `elementReference`

These two properties are mutually exclusive.

Type reference is either a FHIR type name or canonical URL of the FHIR type.

### Base type

The `type` property specified base type of the element.
Data is accepted if both conditions are met:
- Data is accepted when validated against referred type
- Data is accepted by all other conditions on element

### Example
#### Schema
```yaml
{{#include examples/patient-type.yaml}}
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

#### Valid resources
```yaml
~resourceType: Patient
gender: other
```
```yaml
~resourceType: Patient
name:
  - text: James
```

#### Invalid resources
```yaml
~resourceType: Patient
gender: 2
```
```yaml
~resourceType: Patient
name:
  - James
```
```yaml
~resourceType: Patient
gender:
  text: James
```
```yaml
~resourceType: Patient
name:
  - 2
```

### Element reference syntax

Element reference is an array of the following format:
- First element is a type reference
- Other elements are a path in FHIRSchema

### Example
#### Schema
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
#### Schema
```yaml
{{#include examples/questionnaire-typereference.yaml}}
```

#### Valid resources:
```yaml
~resourceType: Questionnaire
~status: draft
item:
  - type: display
~    linkId: q-1
```
```yaml
~resourceType: Questionnaire
~status: draft
item:
  - item:
      - type: display
~        linkId: q-2
    type: group
~    linkId: q-1
```
```yaml
~resourceType: Questionnaire
~status: draft
item:
  - item:
      - item:
          - item:
              - type: display
~                linkId: q-4
~            linkId: q-3
~            type: group
~        linkId: q-2
~        type: group
~    linkId: q-1
~    type: group
```

#### Invalid resources:
```yaml
~resourceType: Questionnaire
~status: draft
item:
  - item:
      - wrongType
~    type: group
    linkId: q-1
```
```yaml
~resourceType: Questionnaire
~status: draft
item:
  - item:
      - item:
          - nonExistentField: abc
~            linkId: q-3
~            type: group
~        linkId: q-2
~        type: group
~    linkId: q-1
~    type: group
```

## Nested elements
The `elements` property define nested element constraints.
Syntactically it is an object, with string keys and Element values.
Semantically it defines behavior of the corresponding fields in data.

### Example
#### Schema
```yaml
{{#include examples/nested-elements.yaml}}
```

#### Valid resource
```yaml
resourceType: Patient
link: 
  - other: 
      reference: http://example.org/patient-path
      type: Patient
    type: refer
```

#### Invalid resource
```yaml
resourceType: Patient
link: 
  - unexisting: true
```

## Terminology binding
Syntax
- `valueSet` (string)
- `strength` (string)

FHIRSchema terminology binding follows FHIR terminology binding.
Both `valueSet` and `strength` properties shall be specified.

The `valueSet` property is a canonical URL referring to the ValueSet
to which the codes in the data element value are bound.
The `strength` property specifies FHIR ValueSet binding strength.
Only `required` bindings are validated.

### Example
#### Schema

```yaml
{{#include examples/patient-binding.yaml}}
```

> Note: there is a `codesystems` property in expanded view of the example schema:
> it is a technical field generated by StructureDefinition to FHIRSchema conversion,
> this field speeds up schema loading, but is irrelevant to writing new schemas.

#### Valid resource:
```yaml
~resourceType: Patient
gender: other
```

#### Invalid resource:
```yaml
~resourceType: Patient
gender: something-not-in-the-valueset
```

### Reference target
The `refers` property lists allows reference targets.
A reference data element is accepted only if it refers to one of the allowed here types.
A target can be either resource type or canonical URL for this resource type.

### Example 
#### Schema:
```yaml
{{#include examples/patient-reference.yaml}}
```

#### Valid resources:
```yaml
~resourceType: Patient
generalPractitioner:
  - reference: Organization/organization-1
```
```yaml
~resourceType: Patient
generalPractitioner:
  - reference: Practitioner/practitioner-1
  - reference: Organization/organization-1
```
```yaml
~resourceType: Patient
generalPractitioner:
  - reference: Practitioner/practitioner-1
```

#### Invalid resources:
```yaml
~resourceType: Patient
generalPractitioner:
  - reference: Patient/patient-1
```
```yaml
~resourceType: Patient
generalPractitioner:
  - reference: Organization/organization-1
  - reference: Patient/patient-1
```

## Pattern matching
There are 2 properties to define elements that match constant values:
- `fixed`: a value that must match the value of element;
- `pattern`: a value that specifies the entries or items that an element must contain. 

### Example

#### Schema with `fixed` element
```yaml
~url:  http://example.com/Patient/patient
~base: http://hl7.org/fhir/StructureDefinition/Patient
~type: Patient
~name: Patient-fixed
elements:
  gender:
    type: code
    fixed: male
  name:
    type: HumanName
    fixed:
      - family: Smith
```

#### Valid resources
```yaml
~meta:
~  profile: 
~     - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: male
name:
  - family: Smith
```

#### Invalid resources
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: male
name:
  - family: Smith
    given: John
```
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: female
name:
  - family: Smith
```
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: male
name:
  - family: Smith
    given: John
```
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: male
name:
  - family: Smith
  - family: Gray
```

#### Schema with `pattern` element
```yaml
~url:  http://example.com/Patient/patient
~base: http://hl7.org/fhir/StructureDefinition/Patient
~type: Patient
~name: Patient-pattern
elements:
  gender: 
    type: code
    pattern: male
  name:
    type: HumanName
    pattern:
      - family: Smith
```

#### Valid resources
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: male
name:
  - family: Smith
```
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: male
name:
  - family: Smith
    given: John
```
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: male
name:
  - family: Smith
  - family: Gray
```

#### Invalid resources
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: female
name:
  - family: Smith
```
```yaml
~meta:
~  profile: 
~    - http://example.com/Patient/patient|1.0.0
resourceType: Patient
gender: male
name:
  - family: Gray
```

## Informational
These properties do not affect validation, but they provide additional information about element.

The `modifier` property mirrors the `ElementDefinition.isModifier` FHIR property.
The _modifier_ element changes the interpretation of the resource.

The `mustSupport` property mirrors the `ElementDefinition.mustSupport` FHIR property.
The _mustSupport_ element must be supported by an implementation.

The `summary` property mirrors the `ElementDefinition.isSummary` FHIR property.
The _summary_ element should be included in FHIR Search in summary mode.


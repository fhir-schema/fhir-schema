# Element

_Element_ is a FHIR Schema component which defines or constrains FHIR data type.

## Syntax
All properties are optional.

`array` (boolean): See [Shape](#shape)\
`scalar` (boolean): See [Shape](#shape)

`min` (integer): See [Cardinality](#cardinality)\
`max` (integer): See [Cardinality](#cardinality)

`choiceOf` (string): see [Polymorphism](#polymorphism)\
`choices` (array of strings): see [Polymorphism](#polymorphism)

`excluded` (array of strings): See [Requires and exclusions](#requires-and-exclusions)\
`required` (array of strings): See [Requires and exclusions](#requires-and-exclusions)

`elementReference` (array of strings): See [Type reference](#type-reference)\
`type` (string): See [Type reference](#type-reference)

`elements` (object): See [Subelement](#subelement)

`constraints` (Constraint): See [Constraint](constraint.md)

`binding` (Binding): valueset binding\
`fixed` (any): Exact value of the element\
`pattern` (any): The element shall match the pattern (see Pattern matching)\
`refers` (array of strings): Allowed reference targets\
`slicing` (Slicing): FHIR Slicing\

## Shape
There are 2 properties controlling element shape:
- `array`
- `scalar`

The `array` and `scalar` properties control element structure. These 2 element are mutually exclusive.
I.e. the folowing element is invalid.
```yaml
array: true
scalar: true
```

If `array` is set, only JSON arrays are excepted.
If `scalar` is set, JSON arrays are rejected.
If neither is set, everything is accepted.
Empty arrays are rejected (they are not allowed by FHIR).

### Example
Schema
```yaml
elements:
  should_be_array:
    type: string
    array: true
  should_be_scalar:
    type: string
    scalar: true
  may_be_anything:
    type: string
```

Valid resources:
```yaml
should_be_array: [abc]
---
should_be_scalar: abc
---
may_be_anything: [abc]
---
may_be_anything: abc
```

Invalid resources:
```yaml
should_be_array: abc
---
should_be_scalar: [abc]
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

## Polymorphism
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

## Subelement
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

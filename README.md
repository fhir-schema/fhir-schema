# FHIR Schema

* [Support chat](https://chat.fhir.org/#narrow/stream/391879-FHIR-Schema)
* [Weekly meetings](TODO)

## 0. Motivation

* there are only few implementations of FHIR validation - why? because it's hard, no unit-tests, esoteric knowledge
* we need more in different languages python, js, golang, rust etc
* every implementers doing similar transformtions to SD (it looks very like JSON schema than StructureDef)
  * most of implementers do convert SD to nested data structure
  * care about arrays (max: *)
  * resolve references
* snapshots is implementation detail leaking into standard, only-differential validation sounds better
* People need simple source of metadata for code-generation and FHIRPath


## 1. Intro

FHIR Schema is a project designed to simplify the implementation and validation
of FHIR (Fast Healthcare Interoperability Resources) resources across different
programming languages. It is heavily inspired by the design of JSON Schema and
introduces a more developer-friendly representation of FHIR
StructureDefinitions.

Key features of FHIR Schema include:

* **Simplified Structure**: FHIR Schema represents FHIR resources and their elements in a more straightforward and intuitive manner compared to FHIR StructureDefinition. Each element is represented as a property of the resource with its type specified directly, which is similar to how data structures are typically defined in programming languages.
* **Nested Elements**: FHIR Schema provides a clear and simple way to represent and validate nested elements in FHIR resources, which is a key requirement for many healthcare data use cases.
* **First-class Arrays**: Identify and label arrays - most of non-xml implementations are distinguish arrays and singular elements - precalculate it
* **Clear Implementation Semantics**: FHIR Schema provides clear semantics for implementing FHIR validation rules, which can make it easier for developers to create robust and reliable FHIR implementations.
* **Source of metadata** for FHIRPath, CQL and code-generation
* **Comprehensive test's suite for implemers** unit tests collection to facilitate validators implementation (like [JSON Schema](https://github.com/json-schema-org/JSON-Schema-Test-Suite))
* **IG File** compact representation of IG as one json.gz file with only important fields, so metadata can be loaded by runtime in miliseconds over network at start
* **Logical Models** first-class support - validation of logical models
* **FHS** first-class support - direct compilation of FSH into FHIR Schema
* **Package** provides one file package with FHIR Schema and how deps are resolved


In summary, FHIR Schema is a  project that aims to make FHIR more accessible and easier to work with for developers, potentially leading to improved interoperability of healthcare systems.



## 2. Specification

Ideas:

* IG is a one ndjson/ndedn object
* Local refs by FQN
* Validation by differentials (no snapshots)

### 2.0 FQN — Fully Qualified Name
FQN Pattern: ```<package-name>#<package-version>/<entity-id>```

## 3 Keywords

### 3.0 order keyword

Order is integer to keep FHIR elements original order

```js
{
  id: HumanName,
  elements:  {
    family: {type: string, order: 1},
    given:  {type: string, array: true, order: 2}
  }
}
```

### 3.1 kind keyword

resource | profile | logical | extension

### 3.2 type keyword

Reference to base schema or type of element.
FHIR Schema supports all FHIR primitive types.

### 3.3 elements keyword

object of elements

```js
{
  elements:  {
    <name>: <schema>,
    family: {type: string},
    given: {type: string, array: true}
  }
}
```

### 3.4 required keyword

array of required elements

```js
{
  required: ['code', 'system'],
  elements: {code: ..., system:...}
}
```

### 3.5 excluded keyword

array of excluded elements

```js
{
  excluded: ['code', 'system']
}
```

### 3.6 binding keyword

resolved reference to valueset `<package>/<name>`

```js
{
  elements: {
    code: { binding: {strength: ..., valueset: ...}}
  }
}
```

### 3.7 enum keyword

For fixed and required bindings with type code enumerate values. Same semantic as JSON Schema **enum**

```js
{ elements: { gender: {enum: ['male','female']}}}

```

### 3.8 Container labels

#### 3.8.1 array

Label arrays for easy lookup

```js
{ elements: { name: {array: true, type: HumanName}}}
```

#### 3.8.1 scalar

Label scalar elements (derivation: constraint + max 1)

```js
{ elements: { gender: {scalar: true, type: code}}}
```

### 3.9 min & max keyword (min/maxItems in JSON Schema)

Only for arrays defines **min** and **max** number of items

### 3.10 slicing keyword

Slicing evaluation: filter by <pattern> and apply schema

**sliceIsConstraining**: if slice constraining existing slice with same name

**reslice**: name of slice that being resliced

```js
identifiers: {
  slicing: {
      discriminator: <slicing.discriminator from ElementDefinition>
      oredered: <boolean>
      rules: "open | closed | openAtEnd"
      slices: {
        <slice-name>: {match: <match>, schema: <schema>, min: ?, max: ?, order: ?, sliceIsConstraining: <boolean>, reslice: <resliced-slice-name>}
      }
  }
 }
```

#### 3.10.1 slicing.match keyword

Describes pattern for slice match.

**type**:
  * pattern — regular pattern matching
  * binding — coded value valid against provided binding
  * profile — data element valid against provided profile
  * type — resourceType / reference type check
  * union-type — specific union sub-type present

**resolve-ref**: parameter that indicates whether a resolved reference is required to match this slice or not

**value**: pattern match values, see Examples

```js
{
  type: "pattern | binding | profile | type | union-type",
  resolve-ref: <boolean>,
  value: <match-pattern>
}
```


### 3.11 choices & element keyword
       
Choice elements <prefix><type> are presented twice as only <prefix> and as <prefixType>, so depending
on your needs you can jump between each others. For example while validationg json you will lookup schema
by data element name in popstixed form (multipleBithInteger), but in FHIRPath `multipleBith.typeOf(?)`  you will do this 
in a different direction.
       
```js
{ multipleBirth: {choices: [multipleBirthInteger,  multipleBirthBoolean]}
  multipleBirthInteger: {type: integer, choiceOf: multipleBirth}
  multipleBirthBoolean: {type: boolean, choiceOf: multipleBirth}}
```       

### 3.12 elementReference

```yaml
id: Questionaire
elements:
  item:
    elements:
       ...
       item: { elementReference: [Questionaire, elements, item] }
```

### 3.13 constraint

"constraint" is object of FHIRPath rules

```yaml
id: Resource
constraint:
  <key>: {<id>: {severity: <>, human: <>, expression: <>}}

```

## 4 Examples

### 4.1 Re-slicing

```js
foo: {
  base: 'http://hl7.org/fhir/StructureDefinition/Patient',
  type: 'Patient',
  elements: {
    address: {
      slicing: {
        rules: 'closed',
        slices: {homeaddress: {min: 1, match: {type: 'pattern', value: {use: 'home'}}}}}}}}
bar: {
  base: 'foo',
  type: 'Patient',
  elements: {
    address: {
      slicing: {
        slices: {a: {reslice: 'homeaddress', max: 2, match: {type: 'pattern', value: {text: 'foo'}}}}}}}}
```
### 4.2 FHIR R4 Patient

```yaml
id: Patient
kind: resource
url: http://hl7.org/fhir/StructureDefinition/Patient
base: hl7.fhir.r4.core#4.0.1/DomainResource
fqn: hl7.fhir.r4.core#4.0.1/Patient
derivation: specialization
type: hl7.fhir.r4.core#4.0.1/Patient
elements:
  identifier:
    type: hl7.fhir.r4.core#4.0.1/Identifier
    array: true
    summary: true
  active:
    modifier: true
    type: hl7.fhir.r4.core#4.0.1/boolean
    summary: true
    scalar: true
  name:
    type: hl7.fhir.r4.core#4.0.1/HumanName
    array: true
    summary: true
  telecom:
    type: hl7.fhir.r4.core#4.0.1/ContactPoint
    array: true
    summary: true
  gender:
    type: hl7.fhir.r4.core#4.0.1/code
    summary: true
    binding:
      valueSet: http://hl7.org/fhir/ValueSet/administrative-gender
      strength: required
      codesystems:
      - http://hl7.org/fhir/administrative-gender
    scalar: true
  deceasedBoolean:
    modifier: true
    type: hl7.fhir.r4.core#4.0.1/boolean
    summary: true
    scalar: true
    choiceOf: deceased
  deceasedDateTime:
    modifier: true
    type: hl7.fhir.r4.core#4.0.1/dateTime
    summary: true
    scalar: true
    choiceOf: deceased
  maritalStatus:
    type: hl7.fhir.r4.core#4.0.1/CodeableConcept
    binding:
      valueSet: http://hl7.org/fhir/ValueSet/marital-status
      strength: extensible
    scalar: true
  managingOrganization:
    refers:
    - hl7.fhir.r4.core#4.0.1/Organization
    type: hl7.fhir.r4.core#4.0.1/Reference
    summary: true
    scalar: true
  multipleBirth:
    choices:
    - multipleBirthBoolean
    - multipleBirthInteger
    scalar: true
  address:
    type: hl7.fhir.r4.core#4.0.1/Address
    array: true
    summary: true
  photo:
    type: hl7.fhir.r4.core#4.0.1/Attachment
    array: true
  link:
    modifier: true
    type: hl7.fhir.r4.core#4.0.1/BackboneElement
    array: true
    elements:
      other:
        refers:
        - hl7.fhir.r4.core#4.0.1/Patient
        - hl7.fhir.r4.core#4.0.1/RelatedPerson
        type: hl7.fhir.r4.core#4.0.1/Reference
        summary: true
        scalar: true
      type:
        type: hl7.fhir.r4.core#4.0.1/code
        summary: true
        binding:
          valueSet: http://hl7.org/fhir/ValueSet/link-type
          strength: required
          codesystems:
          - http://hl7.org/fhir/link-type
        scalar: true
    summary: true
    required:
    - type
    - other
  birthDate:
    type: hl7.fhir.r4.core#4.0.1/date
    summary: true
    scalar: true
  multipleBirthBoolean:
    type: hl7.fhir.r4.core#4.0.1/boolean
    scalar: true
    choiceOf: multipleBirth
  communication:
    type: hl7.fhir.r4.core#4.0.1/BackboneElement
    array: true
    elements:
      language:
        type: hl7.fhir.r4.core#4.0.1/CodeableConcept
        binding:
          valueSet: http://hl7.org/fhir/ValueSet/languages
          strength: preferred
        scalar: true
      preferred:
        type: hl7.fhir.r4.core#4.0.1/boolean
        scalar: true
    required:
    - language
  deceased:
    choices:
    - deceasedBoolean
    - deceasedDateTime
    scalar: true
  generalPractitioner:
    refers:
    - hl7.fhir.r4.core#4.0.1/Organization
    - hl7.fhir.r4.core#4.0.1/Practitioner
    - hl7.fhir.r4.core#4.0.1/PractitionerRole
    type: hl7.fhir.r4.core#4.0.1/Reference
    array: true
  contact:
    constraints:
      pat-1:
        human: SHALL at least contain a contact's details or a reference to an organization
        severity: error
        expression: name.exists() or telecom.exists() or address.exists() or organization.exists()
    type: hl7.fhir.r4.core#4.0.1/BackboneElement
    array: true
    elements:
      relationship:
        type: hl7.fhir.r4.core#4.0.1/CodeableConcept
        array: true
        binding:
          valueSet: http://hl7.org/fhir/ValueSet/patient-contactrelationship
          strength: extensible
      name:
        type: hl7.fhir.r4.core#4.0.1/HumanName
        scalar: true
      telecom:
        type: hl7.fhir.r4.core#4.0.1/ContactPoint
        array: true
      address:
        type: hl7.fhir.r4.core#4.0.1/Address
        scalar: true
      gender:
        type: hl7.fhir.r4.core#4.0.1/code
        binding:
          valueSet: http://hl7.org/fhir/ValueSet/administrative-gender
          strength: required
          codesystems:
          - http://hl7.org/fhir/administrative-gender
        scalar: true
      organization:
        refers:
        - hl7.fhir.r4.core#4.0.1/Organization
        type: hl7.fhir.r4.core#4.0.1/Reference
        scalar: true
      period:
        type: hl7.fhir.r4.core#4.0.1/Period
        scalar: true
  multipleBirthInteger:
    type: hl7.fhir.r4.core#4.0.1/integer
    scalar: true
    choiceOf: multipleBirth


```


## License

FHIR® is the registered trademark of HL7 and is used with the permission of HL7.
Use of the FHIR trademark does not constitute endorsement of the contents of
this repository by HL7, nor affirmation that this data is conformant to the
various applicable standards

## Credits

* Nikolai Ryzhikov @niquola (Health Samurai)
* Evgeny Mukha @ApricotLace (Health Samurai)
* Ivan Bagrov @Panthevm (Health Samurai)
* Ewout Kramer (Firely)
* FHIR Community - https://chat.fhir.org/

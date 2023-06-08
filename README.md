# FHIR Schema

## 0. Motivation

* there is only 1.5 implementation of FHIR validation
* we need more in different languages
* everybody doing the same while implementing, and it looks very like JSON schema than StructureDef
  * most of implementers do convert SD to nested data structure
  * identify arrays
  * resolve all references
* snapshots is implementation detail leaking into standard, only-differential validation sounds better
* People need simple source of metadata for code-generation and FHIRPath

## 1. Intro
FHIR Schema is a project designed to simplify the implementation and validation of FHIR (Fast Healthcare Interoperability Resources) resources across different programming languages. It is heavily inspired by the design of JSON Schema and introduces a more developer-friendly representation of FHIR StructureDefinitions.

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


In summary, FHIR Schema is a  project that aims to make FHIR more accessible and easier to work with for developers, potentially leading to improved interoperability of healthcare systems.



## 2. Specification

Ideas:

* IG is a one JSON object (aka OpenAPI document)
* Local refs by name
* Validation by differentials (no snapshots)
* Snapshot as merge operation


```yaml
@package: 
  name: fhir
  version: 5.0.0
  url: http://hl7.fhir.org
HumanName:
  kind: complex-type
  elements:
     family: {type: string}
     given:  {type: string, array: true}
Resource:
  kind: abstract-resource
  elements:
    id: {type: id}
DomainResource:
  kind: abstract-resource
  type: Resource
  elements:
    text: {type: Narrative }
    containted: {type: Resource, array: true}
Patient:
  kind: resource
  type: DomainResource
  elements:
      identifier: {type: Identifier, array: true, summary: true}
      active:     {type: boolean}
      name:       {type: HumanName, array: true}
      gender:     {type: code, enum: ['male','female','other']}
      # nested elements
      contact:
         type: BackboneElement
         elements:
            relationship: {type: CodeableConcept, binding: {...}}
            name:         {type: HumanName }
            #...
            organization: {type: Reference, refers: [Organization]}
       # choice type
       multipleBirth:
         choices: [integer, boolean]
       multipleBirthInteger: {type: integer, element: multipleBirth}
       multipleBirthBoolean: {type: boolean, element: multipleBirth}
     
 ```
 
 ```yaml
@package: 
  name: us-core
  version: ?
  url: http://hl7.org/fhir/us/core
us-core-patient:
  kind: profile
  type: fhir/Patient # ref to fhir ig
  require: [identifier, name]
  elements:
     extension: 
        race: { type: us-core-race } # local ref
     # or
     extension:
       # <url>: <schema>
       'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race': { type: us-core-race, min: ?, max: ? }
     identifier: { require: [system, value] }
     name: { min: 1 }
us-core-race:
  type: Extension
  extension:
    ombCategory: { array: true, elements: {valueCoding: {...}}}
    detailed: {valueString: {...} }
    text: { }
us-core-vital-signs
  type: profile
  elements:
     status: {type: code}
     category:
       # slicing index by name, filter by pattern and apply schema
       slices:
          VSCat:
            pattern: {coding: {system: '....', code: 'vital-signs'}}
            schema: {...}

 ```
## package document

### @package keyword

## 3 Keywords

### 3.1 kind keyword

resource | profile | logical | extension

### 3.2 type keyword

reference to base schema or type of element

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

### 3.4 require keyword

array of required elements

```js
{
  require: ['code', 'system'],
  elements: {code: ..., system:...}
}
```

### 3.5 binding keyword

resolved reference to valueset `<package>/<name>`

```js
{
  elements: {
    code: { binding: {strength: ..., valueset: ...}}
  }
}
```

### 3.6 enum keyword

For fixed and required bindings with type code enumerate values. Same semantic as JSON Schema **enum**

```js
{ elements: { gender: {enum: ['male','female']}}}

```

### 3.7 array keyword

Label arrays for easy lookup

```js
{ elements: { name: {array: true, type: HumanName}}}
```

### 3.8 min & max keyword (min/maxItems in JSON Schema)

Only for arrays defines **min** and **max** number of items

### 3.9 slicing keyword

Slices are indexed by name to provide **merge** semantic for reslicing.

Slicing evaluation: filter by <pattern> and apply schema

```js
identifiers: {
  slicing: {
      <slice-name>: {pattern: <pattern>, schema: <schema>, min: ?, max: ?}
  }
 }
```

### 3.10 choices & element keyword
       
Choice elements <prefix><type> are presented twice as only <prefix> and as <prefixType>, so depending
on your needs you can jump between each others. For example while validationg json you will lookup schema
by data element name in popstixed form (multipleBithInteger), but in FHIRPath `multipleBith.typeOf(?)`  you will do this 
in a different direction.
       
```js
{ multipleBirth: {choices: [multipleBirthInteger,  multipleBirthBoolean]}
  multipleBirthInteger: {type: integer, choiceOf: multipleBirth}
  multipleBirthBoolean: {type: boolean, choiceOf: multipleBirth}}
```       

### 3.11 elementReference

```yaml
id: Questionaire
elements: 
  item:
    elements:
       ...
       item: { elementReference: [Questionaire, elements, item] }
```
        

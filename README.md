# FHIR Schema

## 1. Intro
FHIR Schema is a project designed to simplify the implementation and validation of FHIR (Fast Healthcare Interoperability Resources) resources across different programming languages. It is heavily inspired by the design of JSON Schema and introduces a more developer-friendly representation of FHIR StructureDefinitions.

Key features of FHIR Schema include:

* **Simplified Structure**: FHIR Schema represents FHIR resources and their elements in a more straightforward and intuitive manner compared to FHIR StructureDefinition. Each element is represented as a property of the resource with its type specified directly, which is similar to how data structures are typically defined in programming languages.
* **Nested Elements**: FHIR Schema provides a clear and simple way to represent and validate nested elements in FHIR resources, which is a key requirement for many healthcare data use cases.
* **Clear Implementation Semantics**: FHIR Schema provides clear semantics for implementing FHIR validation rules, which can make it easier for developers to create robust and reliable FHIR implementations.
* **Source of metadata** for FHIRPath, CQL and code-generation


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
  type: complex-type
  elements:
     family: {type: string}
     given:  {type: string, array: true}
Resource:
  type: abstract-resource
  elements:
    id: {type: id}
DomainResource:
  type: abstract-resource
  base: Resource
  elements:
    text: {type: Narrative }
    containted: {type: Resource, array: true}
Patient:
  type: resource
  base: DomainResource
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
  type: profile
  base: fhir.Patient # ref to fhir ig
  require: [identifier, name]
  elements:
     extension: 
        race: { type: us-core-race } # local ref
     identifier: { require: [system, value] }
     name: { min: 1 }
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

### 3.1 base keyword

### 3.2 type keyword

### 3.3 elements keyword

### 3.4 require keyword

### 3.5 binding keyword

### 3.6 enum keyword

### 3.7 array keyword

### 3.8 min & max keyword

### 3.9 slices keyword

### 3.10 choices & element keyword

### 3.11 recur keyword (elementReference)

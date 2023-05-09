# FHIR Schema

FHIR Schema is a framework to implement FHIR validation, 
inspired by design of JSON Schema. 


It introduces JSON Schema-like representation of the FHIR StructureDefinition
and simplifies the process of implementing FHIR validation.  

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
  base: fhir.Patient
  require: [identifier, name]
  elements:
     extension: 
        race: { type: us-core-race }
     identifier: { require: [system, value] }
     name: { min: 1 }
  
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

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

## Keywords

### base keyword

### type keyword

### elements keyword

### binding keyword

### array keyword

### min & max keyword

### slices keyword

### enum keyword

### choices & element keyword

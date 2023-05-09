# FHIR Schema

FHIR Schema is a framework to implement FHIR validation, 
inspired by design of JSON Schema. 


It introduces JSON Schema-like representation of the FHIR StructureDefinition
and simplifies the process of implementing FHIR validation.  

```yaml
Resource:
  elements:
    id: {type: id}
DomainResource:
  base: Resource
  elements:
    text: {type: Narrative }
    containted: {type: Resource, array: true}
Patient:
  base: DomainResource
  kind: resource
  elements:
      identifier: {type: Identifier, array: true, summary: true}
      active:     {type: boolean}
      name:       {type: HumanName, array: true}
      gender:     {type: code, enum: ['male','female','other']}
      #...
      contact:
         type: BackboneElement
         elements:
            relationship: {type: CodeableConcept, binding: {...}}
            name:         {type: HumanName }
            #...
            organization: {type: Reference, refers: [Organization]}
 ```

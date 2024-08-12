# FHIR Schema
FHIR Schema makes FHIR easier to work with, improving interoperability of healthcare systems.

FHIR Schema is a project designed to simplify the implementation and validation
of FHIR (Fast Healthcare Interoperability Resources) resources across different
programming languages. It is heavily inspired by the design of JSON Schema and
introduces a more developer-friendly representation of FHIR
StructureDefinitions.

FHIR Schema Status: [Trial Use](https://build.fhir.org/versions.html#std-process)

## Key features
- Simple and Intuitive Structure 
- Explicit Arrays
- Clear Operational Semantics
- Human- and machine-readable format at the same time
* Logical models are as easy as regular

## Motivation

* there are only few implementations of FHIR validation - why? because it's hard, no unit-tests, esoteric knowledge
* we need more in different languages python, js, golang, rust etc
* every implementers doing similar transformtions to SD (it looks very like JSON schema than StructureDef)
  * most of implementers do convert SD to nested data structure
  * care about arrays (max: *)
  * resolve references
* snapshots is implementation detail leaking into standard, only-differential validation sounds better
* People need simple source of metadata for code-generation and FHIRPath

---
* [Support chat](https://chat.fhir.org/#narrow/stream/391879-FHIR-Schema)
* [Weekly meetings](TODO)

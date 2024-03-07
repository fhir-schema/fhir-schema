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

See [wiki](https://fhir-schema.github.io/fhir-schema/)


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

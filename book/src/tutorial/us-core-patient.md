# US Core Patient Profile

In this tutorial, we will create a <a href="https://hl7.org/fhir/us/core/STU5.0.1/StructureDefinition-us-core-patient.html" target="_blank">US Core Patient Profile</a> on FHIRSchema from scratch.


### 1. Base type
Since the profile describe the patient structure, it is important to inherit from its base profile.

``` yaml
base: Patient
```

Read more - [Base type](../reference/schema.md#base)

### 2. Profile Identifier
Specify the profile's global canonical identifier.

``` yaml
~base: Patient
url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
```

Read more - [Profile url](../reference/schema.md#url)

### 3. Required elements

Specify the fields that must be present in the data.

* Patient.name
* Patient.gender
* Patient.identifier
* Patient.identifier.system
* Patient.identifier.value
* Patient.telecom.system
* Patient.telecom.value

``` yaml
~base: Patient
~url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
required: [identifier, name, gender]
elements:
  identifier:
    required: [system, value]
  telecom:
    required: [system, value]
```

Read more - [Requires and exclusions](../reference/element.md#requires-and-exclusions)

### 4. Slicing

Describe slicing on extensions using a short notation. Specify that in Patient.extension, there can be four extensions, and no more than one of each.

``` yaml
~base: Patient
~url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
extensions:
  us-core-race:
    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-race
    max: 1
  us-core-ethnicity:
    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity
    max: 1
  us-core-birthsex:
    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex
    max: 1
  us-core-genderIdentity:
    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity
    max: 1
~required: [identifier, name, gender]
~elements:
~  identifier:
~    required: [system, value]
~  telecom:
~    required: [system, value]
```

Read more - [Slicing](../reference/slicing.md)

### 5. Constraints
Describe a constraint using FHIRPath syntax that define the rule:

A patient's name must contain either a family name or a given name; otherwise, there must be an extension explaining the absence of the name.
``` yaml
~base: Patient
~url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
~extensions:
~  us-core-race:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-race
~    max: 1
~  us-core-ethnicity:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity
~    max: 1
~  us-core-birthsex:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex
~    max: 1
~  us-core-genderIdentity:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity
~    max: 1
constraints:
  us-core-6:
    severity: error 
    expression: "(name.family.exists() or name.given.exists()) xor extension.where(url='http://hl7.org/fhir/StructureDefinition~/data-absent-reason').exists()"
    human: "Either Patient.name.given and/or Patient.name.family SHALL be present or a Data Absent Reason Extension SHALL be pr~esent."
~required: [identifier, name, gender]
~elements:
~  identifier:
~    required: [system, value]
~  telecom:
~    required: [system, value]
```

Read more - [Constraints](../reference/constraint.md)

### 6. Terminology bindings

Specify the terminological bindings for coded values.

* Patient.telecom.system - ContactPointSystem _(required)_
* Patient.telecom.use - ContactPointUse _(required)_
* Patient.address.state - USPS Two Letter Alphabetic Codes _(extensible)_
* Patient.communication.language -  Language codes _(extensible)_

``` yaml
~base: Patient
~url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
~extensions:
~  us-core-race:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-race
~    max: 1
~  us-core-ethnicity:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity
~    max: 1
~  us-core-birthsex:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex
~    max: 1
~  us-core-genderIdentity:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity
~    max: 1
~constraints:
~  us-core-6:
~    severity: error 
~    expression: "(name.family.exists() or name.given.exists()) xor extension.where(url='http://hl7.org/fhir/StructureDefinition~/data-absent-reason').exists()"
~    human: "Either Patient.name.given and/or Patient.name.family SHALL be present or a Data Absent Reason Extension SHALL be pr~esent."
~required: [identifier, name, gender]
elements:
~  identifier:
~    required: [system, value]
  telecom:
~    required: [system, value]
    elements:
      system: 
        binding:
          strength: required
          valueSet: http://hl7.org/fhir/ValueSet/contact-point-system
      use:
        binding:
          strength: required
          valueSet: http://hl7.org/fhir/ValueSet/contact-point-use
  gender:
    binding:
      strength: required
      valueSet: http://hl7.org/fhir/ValueSet/administrative-gender
  address:
    elements:
      state:
        binding:
          strength: extensible
          valueSet: http://hl7.org/fhir/us/core/ValueSet/us-core-usps-state
  communication:
    elements:
      language:
        binding:
          strength: extensible
          valueSet: http://hl7.org/fhir/us/core/ValueSet/simple-language
```

Read more - [Terminology bindings](../reference/element.md#terminology-binding)

### 7. Flags

Indicate the **mustSupport** flag to describe that systems claiming to conform to a given profile must "support" the element.

``` yaml
~base: Patient
~url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
~extensions:
~  us-core-race:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-race
~    max: 1
~  us-core-ethnicity:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity
~    max: 1
~  us-core-birthsex:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex
~    max: 1
~  us-core-genderIdentity:
~    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity
~    max: 1
~constraints:
~  us-core-6:
~    severity: error 
~    expression: "(name.family.exists() or name.given.exists()) xor extension.where(url='http://hl7.org/fhir/StructureDefinition~/data-absent-reason').exists()"
~    human: "Either Patient.name.given and/or Patient.name.family SHALL be present or a Data Absent Reason Extension SHALL be pr~esent."
~required: [identifier, name, gender]
elements:
  identifier:
~    required: [system, value]
    mustSupport: true
    elements:
      system: 
        mustSupport: true
      value: 
        mustSupport: true
  name:
    elements:
      family:
        mustSupport: true
      given:
        mustSupport: true
  telecom:
~    required: [system, value]
    elements:
      system: 
        mustSupport: true
~        binding:
~          strength: required
~          valueSet: http://hl7.org/fhir/ValueSet/contact-point-system
      value: 
        mustSupport: true
      use: 
        mustSupport: true
~        binding:
~          strength: required
~          valueSet: http://hl7.org/fhir/ValueSet/contact-point-use
  gender:
    mustSupport: true
~    binding:
~      strength: required
~      valueSet: http://hl7.org/fhir/ValueSet/administrative-gender
  birthDate:
    mustSupport: true
  address:
    mustSupport: true
    elements:
      line:
        mustSupport: true
      city:
        mustSupport: true
      state:
        mustSupport: true
~         binding:
~           strength: extensible
~           valueSet: http://hl7.org/fhir/us/core/ValueSet/us-core-usps-state
      postalCode:
        mustSupport: true
      period:
        mustSupport: true
  communication:
    elements:
      language:
        mustSupport: true
~        binding:
~          strength: extensible
~          valueSet: http://hl7.org/fhir/us/core/ValueSet/simple-language
```

Read more - [Element flags](../reference/element.md#informational)

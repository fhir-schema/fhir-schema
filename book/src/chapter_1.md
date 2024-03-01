# Element

The **Element** is a fundamental component of the **FHIR Schema**, allowing for the definition of various **FHIR** data types:

- primitive types _(string, boolean, integer, etc.)_
- complex types _(Address, HumanName, etc.)_
- resources _(Patient, Encounter, Practitioner, etc.)_

**Example:**

```yaml
type: Patient
```

> An element constrained by the Patient resource structure.


## Nested elements

The **Element** can describe nested elements.

**Example:**

```yaml
type: Patient
elements:
  gender:
    type: code
  name:
    type: HumanName
```
> The `Patient` element defines `gender` and `name` elements.

## Element cardinality

Cardinality rules limit the number of times an element can be repeated. Each element inherits its cardinality from the parent type.

The cardinality restriction of the parent type has the following limitations:

- A required element cannot become optional (`1..1` cannot change to `0..1`)
- A scalar element cannot become an array (`0..1` cannot change to `0..*`)


### Required elements

Use the `required` keyword to define elements that must be present in the data.

**Example:**
```yaml
type: Patient
required:
  - gender
  - identifier
elements:
  gender:
    type: code
  name:
    type: HumanName
```
> The `Patient` element requires the `gender` and `identifier` fields.

### Excluded elements

Use the `excluded` keyword to define elements that must not be present in the data.

**Example:**

```yaml
type: Patient
excluded:
  - gender
  - identifier
elements:
  gender:
    type: code
  name:
    type: HumanName
```

> The `Patient` element has the `gender` and `identifier` elements excluded.

### Array cardinality
Use the `min` and `max` keywords to set the allowed number of elements.

**Example:**

```yaml
type: Patient
elements:
  gender:
    type: code
  name:
    type: HumanName
    min: 2
    max: 3
```
> The `Patient` resource must contain 2 to 3 names. 

## Constant value

### Fixed values
Use the `fixed` keyword to specify a value that must exactly match the value of this element in the data, if present. 

**Example:**

```yaml
type: Patient
elements:
  gender:
    type: code
    fixed: male
  name:
    type: HumanName
    fixed:
      family: John
```
> A fixed value of `gender` equal to "male" and a `name` that must contain only one field, `family`, equal to "John".

### Pattern value

Use the `pattern` keyword to specify a value that each occurrence of the element in the data shall follow - that is.

**Example:**

```yaml
type: Patient
elements:
  gender:
    type: code
    pattern: male
  name:
    type: HumanName
    pattern:
      use: usual
```

>  A fixed value of `gender` equal to "male" and a `name` that must contain a `use` field equal to "usual".

## Coded values

To define an element with a fixed set of coded values, use the `binding` keyword. Specify the value set (`valueSet`) and the degree of conformance (`strength`).

This keyword can be specified on types such as:
- code
- Coding
- CodeableConcept

**Example:**

```yaml
type: Patient
elements:
  gender:
    binding:
      valueSet: http://hl7.org/fhir/ValueSet/administrative-gender
      strength: required
```
> The patient's `gender` must necessarily correspond to a value from the `administrative-gender` value set.


## Choice elements 

The elements can have a choice of more than one datatype for their content.

### Restrict datatypes

To limit the permissible data types, you need to define an element that lists the acceptable types.

```yaml
type: Patient
elements:
  deceased:
    choices:
      - deceasedBoolean
```

> A choice element named `deceased` is limited to a single type `boolean`


### Type describing

To describe a particular type for a choice element, you should declare an element and indicate its connection to the choice element.


```yaml
type: Patient
elements:
  deceased:
    choices:
      - deceasedBoolean
    deceasedBoolean:
      choiceOf: deceased
      fixed: false
```

> A choice element named `deceased` is limited to a single type `boolean` with a fixed value of `false`.


## Recursive elements

Within the FHIR StructureDefinition resource, you can define recursive elements. A recursive element is one that contains a property with the same element definition, allowing for indefinite nesting of these elements. Examples of recursive elements include CodeSystem.concept.concept, Questionnaire.item.item, and QuestionnaireResponse.item.item.

You can define such schemas using the elementReference property, which involves referencing a part of the schema by providing the path to that element.

```yaml
elements:
  concept:
    array: true
    elements:
      concept:
        array: true
        elementReference:
          - hl7.fhir.r4.core#4.0.1/CodeSystem
          - elements
          - concept
```
> Here is an example of a CodeSystem resource segment expressed in the FHIR Schema:

>[!IMPORTANT]
>When defining constraints for a recursive part of a resource in your profile, the element reference path must start with the fully qualified name (FQN) of the profile you are writing. If not, the nested elements will be validated against the base schema.

```yaml
elements:
  item:
    elements:
      item:
        elementReference:
          - hl7.fhir.uv.sdc#3.0.0/sdc-questionnaire
          - elements
          - item
```
> Here is an example of a SDC Questionnaire profile segment expressed in the FHIR Schema

## Constraints

Profile authors can define various data constraints using the FHIRPath language. Constraints definition in FHIR Schema are quite similar to FHIR StructureDefinition. To specify constraints, begin with a `constraints` declaration. `Constraints` is a map where the key is the ID of your constraint, which can be used to selectively disable certain constraints during validation. The value is the definition of the constraint, which includes the following properties:

### Severity
- error
- warning

A constraint marked as `error` that fails, will result in a validation error.

### Human

This is a textual description of your constraint. While not mandatory, it is typically beneficial to include at least a brief explanation of your constraint.

### Expression

This is the FHIRPath expression.

```yaml
elements:
  contact:
    constraints:
      pat-1:
        human: SHALL at least contain a contact's details or a reference to an organization
        severity: error
        expression: name.exists() or telecom.exists() or address.exists() or organization.exists()
```

> Above is an example of a constraint defined on the base `hl7.fhir.r4.core Patient` resource, expressed in the FHIR Schema.

>[!IMPORTANT]
> The FHIRPath `%context` variable is initialized based on where the constraint is defined. If it's at the root of the FHIR Schema, `%context` will be the entire resource. However, in the example provided, an invariant defined on `Patient.contact` will behave differently; `%context` will be initialized with the value of `Patient.contact[i]`.


## Resource references

Elements can act as references to specific resources or profiles.

### Target type restriction

To restrict the permissible target resources, the keyword `refers` can be used.

**Example**
```yaml
type: Patient
elements:
  generalPractitioner:
    refers:
      - Practitioner
```

> The element `generalPractitioner` is a `Reference` type that exclusively refers to the `Practitioner`  resource.

**Example**
```yaml
type: Patient
elements:
  generalPractitioner:
    refers:
      - hl7.fhir.us.core#5.0.1/us-core-practitioner
```

> The element `generalPractitioner` is a `Reference` type that exclusively refers to the `us-core-practitioner`  profile.

## Extensions

To describe an FHIR extension, the key `extensions` is used. This key specifies the URL of the extension as a discriminating value and `elements` to describe the structure.

**Example**
```yaml
type: Patient
extensions:
  sex:
    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex
    min: 0
    max: 1
    elements:
      value:
        choices:
          - valueCode
      valueCode:
        binding:
          valueSet: http://hl7.org/fhir/us/core/ValueSet/birthsex
          stength: required
```

Nested extensions can also be described.

**Example**

```yaml
type: Patient
extensions:
  race:
    url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-race
    min: 0
    extensions:
      text:
        url: text
        elements:
          value:
            choices:
              - valueString
```

## Slicing

Slicing is a crucial feature for constraining arrays in FHIR Schemas. It enables the division of arrays to sub-arrays, each sub-array has specific constraints on its elements. Slicing is particularly useful for dividing an array into sub-arrays where each contains a single element, thus facilitating precise constraints on individual elements within the array.

Slicing begins with the `slicing` keyword:

```yaml
elements:
  name:
    slicing:
      ...
```

Within the slicing declaration, various constraints related to the slicing process, such as order awareness and the determination of slicing as open or closed, are defined.

### Defining Slices

To identify the elements that will form a specific sub-array (referred to as a **slice**), it is necessary to define a matcher. This is accomplished using the `match` keyword. There are several types of matchers, each serving different purposes:

#### Pattern

This matcher type allows for the specification of a pattern that will be compared against each element in the source array. The comparison is based on partial equality; that is, for an element to match, it must possess all the properties and values outlined in the pattern but can also include additional properties.

For example, by using the pattern:

```yaml
system: http://hl7.org/fhir/sid/us-npi
```

It would be possible to match the data element:

```yaml
use: official
system: http://hl7.org/fhir/sid/us-npi
value: 1346336807
```

To define a slice utilizing this match type, the schema would look like this:

```yaml
slicing:
  slices:
    <your-slice-name>:
      match:
        type: pattern
        value:
          system: http://hl7.org/fhir/sid/us-npi
```

#### Binding

This matcher type allows for the specification of a terminology binding that will be checked against each element in the source array, that is, element will be matched in slice if it passes terminology binding check. The array this slicing defined in must be one of the following type: `code`, `Coding`, `CodeableConcept`.

``` yaml
slicing:
  slices:
    <your-slice-name>:
      match:
        type: binding
        value:
          strength: required
          valueSet: http://some-valueset-url.com
```

#### Profile
This matcher type allows for the specification of a reference to a profile that will be validated against data elements, if validation returns no errors - array element will be matched in slice 

``` yaml
slicing:
  slices:
    <your-slice-name>:
      match:
        type: profile
        value: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
```

``` yaml
slicing:
  slices:
    <your-slice-name>:
      match:
        type: profile
        value: 
          resource: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
```

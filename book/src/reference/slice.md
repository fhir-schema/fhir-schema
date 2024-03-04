# Slice

## Syntax
**[Slice ID](#slice-id)** property:
- `<your-slice-id>` (string)

  **[Match](#slice-matching)** property:
  - `match` (Match)
  
  **[Cardinality](#cardinality)** properties:
  - `min` (integer)
  - `max` (integer)
  
  **[Order](#order)** property:
  - `order` (integer)
  
  **[Reslice](#reslice)** property:
  - `reslice` (string)
  
  **[Constrain existing slice](#constraining-existing-slice)** property:
  - `sliceIsConstraining` (boolean)
  
  **[Schema](element.md)** property
  - `schema` (Element)

## Slice matching
A _slice_ of an array is a subarray of the original array. This subarray is selected using match expressions. Let's overview existing match types:

### Pattern

This matcher type enables the specification of a pattern to be compared against each element in the source array. The comparison relies on partial equality, meaning that for an element to match, it must contain all the properties and values specified in the pattern but may also have additional properties.

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

#### resolve-ref

If you are slicing a reference array and want to check your pattern against the **actual** reference target, **not** the reference data element, add the `resolve-ref: true` declaration.

### Binding

This matcher enables the specification of a terminology binding that will be checked against each element in the source array. 
An element will be matched in the slice if it passes the terminology binding check. 
The array in which this slicing is defined must be one of the following types: `code`, `Coding`, or `CodeableConcept`.

Consider folowing  US Core 5.0.1 Condition Problems and Health Concerns schema:

```yaml
{{#include examples/patient-slices-binding.yaml}}
```

> Human interpretation of the slice: _There should be at least one `CodeableConcept` in `category` that matches the provided terminology binding._


### Profile

This matcher type enables the specification of a reference to a profile against which data elements will be validated. If the validation returns no errors, the array element will be matched in the slice.

Consider this two custom schemas for Patient and Bundle resources:

##### Patient
```yaml
{{#include examples/patient-slices-profile-custom-patient.yaml}}
```

##### Bundle
```yaml
{{#include examples/patient-slices-profile-custom-bundle.yaml}}
```
> Human interpretation of the slice: there should be only one resource entry that fully conforms to `custom-pat` profile

#### resolve-ref

If you are slicing a reference array and want to check your profile against the **actual** reference target, **not** the reference data element, add the `resolve-ref: true` declaration.

```yaml
{{#include examples/patient-slices-profile.yaml}}
```
> Human interpretation of the slice: _at least one reference should point to Encounter resource that fully conforms to `http://hl7.org/fhir/us/davinci-alerts/StructureDefinition/adt-notification-encounter` profile_

### Type

This matcher type enables the specification of a type against which data elements will be checked.

Consider this Davinici 0.1.0 Alerts schema:

```yaml
{{#include examples/patient-slices-type-local.yaml}}
```
> Human interpretation of the slice: _there should be only one MessageHeader resource among the bundle entries_

#### resolve-ref

Consider this IHE Interactive Multimedia Report (IMR) DiagnosticReport schema

```yaml
{{#include examples/patient-slices-type-ref.yaml}}
```

> Human interpretation of the slice: _there should be only one `performer` reference of type `   Organization`_
## Cardinality

You can constrain the number of elements your slice will match by providing `min` and `max` properties. Omit the `max` property to match an unlimited number of elements.

## Order

## Reslice

## Constraining existing slice

## Schema

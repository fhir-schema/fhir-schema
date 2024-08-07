# Slice

A _slice_ of an array is a subarray of the original array to which you can apply constraints. It is a part of [_Slicing_](#Slicing).

## Syntax
_[Match](#slice-matching)_ property:
- `match` (Match)
  
_[Cardinality](#cardinality)_ properties:
- `min` (integer)
- `max` (integer)

_[Order](#order)_ property:
- `order` (integer)

_[Reslice](#reslice)_ property:
- `reslice` (string)

_[Constrain existing slice](#constraining-existing-slice)_ property:
- `sliceIsConstraining` (boolean)

_[Schema](element.md)_ property
- `schema` (Element)

## Slice matching

### Syntax
*Type* property:
- `type` (string: pattern|binding|profile|type)

*Resolve ref (Obtain reference target and perform checks on it?)* property:
- `resolve-ref` (boolean)

*Pattern / Binding / Profile / Type specification* property:
- `value` (Object)

A _slice_ of an array is a subarray of the original array. This subarray is selected using match expressions. Let's overview existing match types:

### Pattern

This matcher type enables the specification of a pattern to be compared against each element in the source array. The comparison relies on partial equality, meaning that for an element to match, it must contain all the properties and values specified in the pattern but may also have additional properties.

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


#### Matched data element
The following data element will be matched into the slice defined earlier:

```yaml
use: official
system: http://hl7.org/fhir/sid/us-npi
value: 1346336807
```

#### Unmatched data element
The following data element won't be matched into the slice defined earlier:

```yaml
use: official
system: some-custom-system
value: some-value
```

#### resolve-ref

If you are slicing a reference array and want to check your pattern against the **actual** reference target, **not** the reference data element, add the `resolve-ref: true` declaration.

Consider FHIR R4 lipidprofile:

```yaml
{{#include examples/lipidprofile-slices.yaml}}
```

> Human interpretation of the slice: _The first reference should point to a cholesterol resource that contains the same `code` as used in the `value` property._ 

### Binding

This matcher enables the specification of a terminology binding that will be checked against each element in the source array. 
An element will be matched in the slice if it passes the terminology binding check. 
The array in which this slicing is defined must be one of the following types: `code`, `Coding`, or `CodeableConcept`.

Consider folowing  US Core 5.0.1 Condition Problems and Health Concerns schema:

```yaml
{{#include examples/patient-slices-binding.yaml}}
```
> Human interpretation of the slice: _There should be at least one `CodeableConcept` in `category` that matches the provided terminology binding._

#### Matched data element

The following data element will be matched into the slice defined earlier:

```yaml
coding:
- system: http://terminology.hl7.org/CodeSystem/condition-category
  code: problem-list-item

```

#### Unmatched data element

The following data element won't be matched into the slice defined earlier (_terminology biding violation_):
```yaml
coding:
- system: http://terminology.hl7.org/CodeSystem/condition-category
  code: some-random-code

```

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


#### Matched data element

The following data element (`entry.0.resource`) will be matched into the slice defined earlier:

```yaml
meta:
  profile:
  - custom-bundle
resourceType: Bundle
type: transaction
entry:
- request:
    method: POST
    url: "/Patient"
  resource:
    resourceType: Patient
    gender: male
```


#### Unmatched data element

The following data element (`entry.0.resource`) won't be matched (due to missed `gender` property) into the slice defined earlier:

```yaml
meta:
  profile:
  - custom-bundle
resourceType: Bundle
type: transaction
entry:
- request:
    method: POST
    url: "/Patient"
  resource:
    resourceType: Patient
```

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

#### Matched data element

The following data element (`entry.0.resource`) will be matched into the slice defined earlier:

```yaml
resourceType: Bundle
meta:
  profile:
  - http://hl7.org/fhir/us/davinci-alerts/StructureDefinition/notifications-bundle
type: message
entry:
- resource:
    resourceType: MessageHeader
    eventCoding:
      code: code
    source:
      endpoint: google.com
```

#### Unmatched data element

The following data element (`entry.0.resource`) won't be matched (due to wrong resource type) into the slice defined earlier:

```yaml
resourceType: Bundle
meta:
  profile:
  - http://hl7.org/fhir/us/davinci-alerts/StructureDefinition/notifications-bundle
type: message
entry:
- resource:
    resourceType: Patient
```

#### resolve-ref

If you are slicing a reference array and want to check your reference type add the resolve-ref: true declaration.

Consider this IHE Interactive Multimedia Report (IMR) DiagnosticReport schema

```yaml
{{#include examples/patient-slices-type-ref.yaml}}
```


#### Matched data element

The following data element (`performer.0`) will be matched into the slice defined earlier:

```yaml
meta:
  profile:
  - https://profiles.ihe.net/RAD/IMR/StructureDefinition/imr-diagnosticreport
resourceType: DiagnosticReport
performer:
- reference: Organization/1

```

#### Unmatched data element

The following data element (`performer.0`) won't be matched (due to wrong reference type) into the slice defined earlier:

```yaml
meta:
  profile:
  - https://profiles.ihe.net/RAD/IMR/StructureDefinition/imr-diagnosticreport
resourceType: DiagnosticReport
performer:
- reference: Practitioner/1

```

> Human interpretation of the slice: _there should be only one `performer` reference of type `   Organization`_
## Cardinality

You can constrain the number of elements your slice will match by providing min and max properties. Omit the max property to match an unlimited number of elements. To make a slice required, provide a min value of 1 or greater.

Consider following US Core 5.0.1 race extension schema

```yaml
{{#include examples/patient-slices-cardinality.yaml}}
```

#### Valid case
The following data elements will be matched into the slices defined earlier:

```yaml
extension:
- url: ombCategory
  valueCoding:
    system: urn:oid:2.16.840.1.113883.6.238
    code: 2028-9
    display: Asian
- url: text
  valueString: Asian
url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-race
```

#### Invalid case
Due to the absence of text, the text slice won't be matched, resulting in a validation error, since the text slice is required.

```yaml
extension:
- url: ombCategory
  valueCoding:
    system: urn:oid:2.16.840.1.113883.6.238
    code: 2028-9
    display: Asian
url: http://hl7.org/fhir/us/core/StructureDefinition/us-core-race
```

## Order

Defines the slice order in the case of ordered slicing. Please refer to [ordered slicing](slicing.md#slicing-order) specification page.

## Reslice

It's sometimes necessary to slice data that has already been sliced in the base profile - that is, create new slices within the existing slices. This is called _Re-slicing_. Using `reslice` property you can refer to an existing slice and start re-slicing definition.

Consider this two custom schemas:

##### Schema `foo`
```yaml
{{#include examples/patient-slice-re-slice-foo.yaml}}
```
> Human interpretation of the slice: _there should be at least one address with `use: home`_


##### Schema `bar`
```yaml
{{#include examples/patient-slice-re-slice-bar.yaml}}
```
> Human interpretation of the slice: _Within elements matched to the homeaddress slice, there should be a maximum of 2 elements with text: foo._

### Valid case
The following addresses will be matched into the slices defined earlier:

```yaml
resourceType: Patient
meta:
  profile:
  - bar
address:
- use: home
  text: foo
- use: home
  text: foo
```

### Invalid case
The following addresses won't be matched into the `homeaddress/a` re-slice defined earlier due to max limit (2) exceed:

```yaml
resourceType: Patient
meta:
  profile:
  - bar
address:
- use: home
  text: foo
- use: home
  text: foo
- use: home
  text: foo
```

## Constraining existing slice

You can further constrain slice defined earlier in parent schemas by using same slice name and setting `sliceIsConstraining` property to `true`. Usually it's a good way to forbid an optional slice.

Consider following custom schemas:

##### Schema `foo`
```yaml
{{#include examples/patient-slices-is-constraining-foo.yaml}}
```

##### Schema `bar`
```yaml
{{#include examples/patient-slices-is-constraining-bar.yaml}}
```

### Valid case

The following addresses won't be matched in any of slices defined earlier. 

```yaml
resourceType: Patient
meta:
  profile:
  - bar
address:
- use: office
  text: foo

```

### Invalid case

The following addresses will be matched into the `homeaddress` slice, which violates our additional constraint in the profile `bar`.

```yaml
resourceType: Patient
meta:
  profile:
  - bar
address:
- use: home
  text: foo

```

## @default slice

Reserved slice ID, you can mention this slice only if you have closed slicing; all unmatched data elements will be checked against this slice.

Consider following custom schema:

```yaml
base: http://hl7.org/fhir/StructureDefinition/Patient
type: Patient
elements:
  address:
    slicing:
      rules: closed
      ordered: true
      slices:
        homeaddress:
          min: 1
          match:
            type: pattern
            value:
              use: home
          order: 0
        "@default":
          schema:
            required:
            - type
            elements:
              use:
                fixed: billing
          order: 1

```
> Human description of the slice: there shoud be at least one address with `use: home`, also it should preced addresses with `use: billing`

### Valid case

The following addresses will be matched into the slices defined earlier.

```yaml
resourceType: Patient
meta:
  profile:
  - bar
address:
- use: home
- use: billing
```

### Invalid case

The following addresses won't be matched into the slices defined earlier due to incorrect order.

```yaml
resourceType: Patient
meta:
  profile:
  - bar
address:
- use: billing
- use: home
```

## Schema

After an element is matched by the `match` property, you can define additional constraints via the `schema` property. This property is essentially an [Element](element.md), and the matched data element will be validated against the provided schema as usual. If the validator produces errors during the validation of this element, it will count as an unmatched slice element.

Consider following custom schema:

```yaml
base: Patient
url: custom-pat
elements:
  name:
    slicing:
      slices:
        off-name:
          schema:
            constraints:
              off-nam-constr-1:
                expression: given.exists() or family.exists()
                severity: error
          match:
            type: pattern
            min: 1
            value:
              use: official

```
> Human description of the slice: there should be at least one name with `use: official`, this name must contain `given` or `family`.

### Valid case

The following name will be matched into slice defined earlier.

```yaml
resourceType: Patient
name:
  - use: official
    given:
      - John
```

### Invalid cases

No `official` name.

```yaml
resourceType: Patient
name:
  - use: nickname
    given:
      - test
```

No `given` or `family`.
```yaml
resourceType: Patient
name:
  - use: official
    text: test
```

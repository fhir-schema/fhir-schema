# Schema

The _schema_ defines elements and specifies constraint rules,
which are applied on top of base schemas.

## Syntax

### Properties applicable only to schema

*All properties are required*

*[Base type](#base)* property

- `base` : string

*[URL](#url)* property

- `url` : string

*[Resource type](#resource-type)* property

- `type` : string

*[Name](#name)* property

- `name` : string


### Properties shared with *[elements](element.md)*

*[Requires and exclusions](element.md#requires-and-exclusions)* properties

- `excluded` (array of strings)
- `required` (array of strings)

*[Nested elements](element.md#subelement)* property

- `elements` (object)

*[Constraints](constraint.md)* property

- `constraints`

*[Extensions](extensions.md)* property

- `extensions`

## Base

The `base` property defines the base profile from which schema will
inherit all *[elements](element.md#subelement)* and *[constraints](/reference/constraint.md)*

### Example

You can create resource with base profile of US Core Patient:

```yaml
~url: http://example.com/patient
base: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient|6.0.0
~type: Patient
~name: ExamplePatient
```

#### Valid Patient resource:

```yaml
~resourceType: Patient
~meta:
~  profile:
~  - http://example.com/patient
~identifier:
~- system: exampleSystem
~  value: exampleValue
gender: male
~name:
~- given:
~  - Example name
```

#### Invalid Patient resource with wrong `gender` type:

```yaml
~resourceType: Patient
~meta:
~  profile:
~  - http://example.com/patient
~identifier:
~- system: exampleSystem
~  value: exampleValue
gender: true # wrong type
~name:
~- given:
~  - Example name
```

## URL

The `url` is used to reference the profile in `base` property in other profiles.

### Example

After creating profile with following url:

```yaml
base: http://hl7.org/fhir/StructureDefinition/Patient
url: http://example.com/Patient/patient
elements:
  new-element:
    type: string
```

You can reference it, for example, in `base` property from another profile:

```yaml
base: http://example.com/Patient/patient|1.0.0
```

Or you can reference it with `meta.profile` in resource, if you want to validate resource against not default profile:

#### Valid Patient resource
```yaml
meta:
  profile: http://example.com/Patient/patient|1.0.0
new-element: "Example"
```

#### Invalid Patient resource with wrong elements type
```yaml
meta:
  profile: http://example.com/Patient/patient|1.0.0
new-element: true
```

## Resource type

The `type` property defines which resource type being constrained.
The type **must** match with `type` property of base profile.

Example:
```yaml
base: http://hl7.org/fhir/StructureDefinition/Patient
type: Patient
```

## Name

Property `name` is machine readable name of profile. It is can be used as alias.

### Example

After creating profile

```yaml
name: ExamplePatient
```

You can reference it with name in other profiles

```yaml

elements:
  a:
    refers: [ExamplePatient]

```

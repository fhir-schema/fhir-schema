# Schema

## Syntax

### Required properties

*[URL](#url)* property

- `url` : string

*[Base type](#base-type)* property

- `base` : string

*[Resource type](#base-type)* property

- `type` : string

*[Name](#name)* property

- `name` : string

### Optional properties

*[Requires and exclusions](element.md#requires-and-exclusions)* properties

- `excluded` (array of strings)
- `required` (array of strings)

*[Nested elements](element.md#subelement)* property

- `elements` (object)

*[Constraints](/reference/constraint.md)* property

- `constraints`

*[Extensions](#extensions)* property

- `extensions`

## URL

The `url` is used to reference this profile in `base` property in other profiles.

### Example

After creating profile with following url:

```yaml

url: http://example.com/Patient/patient

```

You can reference it, for example, in `base` property from another profile:

```yaml

base: http://example.com/Patient/patient|1.0.0

```

## Base

The `base` property defines the base profile from which schema will
inherit all *[elements](element.md#subelement)* and *[constraints](/reference/constraint.md)*

### Example

Scheme

```yaml

base: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient|6.1.0

```

## Resource type

The `type` property defines which resource type being constrained.
The type **must** match with `type` property of base profile.

### Example

Schema

```yaml

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

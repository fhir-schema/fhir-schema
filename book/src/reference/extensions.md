# Extensions

<div class="warning">
Extensions make schemas incompatible with FHIR!

Use only if there is no other way to model your data.
</div>


FHIR-Schema defines optional extensions.
These extensions allow to model data not representable in FHIR otherwise.
However when using these extensions it is not possible to convert FHIR-Schema into equivalent
StructureDefinition.


## Enable Fhir-schema extensions
To enable FHIR-Schema extensions, the following key must be present at the top level of a FHIR-Schema definition:
```yaml 
ALLOW_FHIR_SCHEMA_FHIR_INCOMPATIBLE_EXTENSIONS: true
```

Any extensions are allowed ONLY for schemas with 
```yaml
derivation: specialization
```

If any extensions found in the schema while the key described above is not present, the schema is rejected as invalid.

## Available extensions

### any
Any element (including the top-level one) can contain the
```yaml
any: true
```
property. If this property is present, the contents of the corresponding subtree of a resource is not validated.

#### Usage example
```yaml
ALLOW_FHIR_SCHEMA_FHIR_INCOMPATIBLE_EXTENSIONS: true
url: schema-1
elements:
  knownElement:
    any: true
```

#### Limitations
The `any` property exlusive with any other properties:
- If there are multiple schemas for an element, where at least one specifies the `any` property, it will be rejected as invalid.
- If there are multiple schemas for an element, where at least one specifies _any other property_, it will be rejected as invalid.

For example, this is prohibited:
```yaml
ALLOW_FHIR_SCHEMA_FHIR_INCOMPATIBLE_EXTENSIONS: true
url: schema-1
elements:
  knownElement:
    any: true
---
ALLOW_FHIR_SCHEMA_FHIR_INCOMPATIBLE_EXTENSIONS: true
url: schema-2
base: schema-1
elements:
  knownElement:
    type: string
```

### additionalProperties
Any element (including the top-level one) can contain the
```yaml
additionalProperties:
  # <schema for additional properties>
```
property. Any key which does not correspond to any key defined in the `elements` property is validated using the schema supplied under the `additionalProperties` property.

#### Usage example
The following example means that any property except `knownElement` and `_knownElement`
is allowed and valid if it is a string value.

Schema:
```yaml
ALLOW_FHIR_SCHEMA_FHIR_INCOMPATIBLE_EXTENSIONS: true
url: schema-1
elements:
  knownElement:
    type: integer
additionalProperties:
  type: string
```

Valid resource:
```yaml
knownElement: 1
_knownElement:
  id: test
unknownElement: stringValue
_unknownElement: test2
______: test3
```

Invalid resources:
```yaml
knownElement: 1
unknownElement: 2
---
knownElement: 1
_knownElement: test
```

#### Limitations
FHIR reserves the underscore (`_`) characters in property names.
FHIR JSON representation separates any element in two parts:
- `propertyName` 
- `_propertyName`

Property resolution behavior:
- If the property _does not start with underscore_ and is _defined in elements_,
   it is interpreted as a normal part of the corresponding element.
- If the property _starts with a single underscore_, and the _corresponding property name
   without underscore is defined in elements_, it is interpreted as an underscored part
   of the corresponding element.
- _Otherwise_, it is interpreted as a normal part of an element specified under
   the `additionalProperties` property (regardless of underscores).


## Extensions reserved for future use
The following properties are reserved for future use:
- `properties`
- `additionalElements`

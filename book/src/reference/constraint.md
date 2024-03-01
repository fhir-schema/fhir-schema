# Constraint

_Constraint_ is a FHIR Schema component which defines FHIRPath constraints.

## Syntax

*[Constraint ID](#constraint-id)* property
- `<your-constraint-id>` (string)

  *[Expression](#expression)* property
  - `expression` (string)
  
  *[Human](#human)* property
  - `human` (string)
  
  *[Severity](#human)* property
  - `severity` (string)
  
## Constraint ID

The constraint ID should be unique within the scope of the constraints declaration. It provides a name for your constraint, which may be used in error logging to identify which specific constraint generated an error.

## Expression

FHIRPath expression. Please refer to the [ANSI FHIRPath specification](https://build.fhir.org/ig/HL7/FHIRPath/) for technical details about the language.

### Examples

Constraint related to the contact attribute defined in the FHIR R4 Patient schema:

```yaml
{{#include examples/patient-constraints.yaml}}
```

Following data sample conforms to schema mentioned earlier:

```yaml
{{#include examples/patient-resource-constraints.yaml}}
```

Following data sample didn't conform to schema mentioned earlier:

```yaml
{{#include examples/invalid-patient-resource-constraints.yaml}}
```

## Variables in expressions

The ANSI FHIRPath specification predefines two environment variables that should be present in the evaluation context of the FHIRPath engine:

- `%ucum` — (string) URL for UCUM (http://unitsofmeasure.org), as per http://hl7.org/fhir/ucum.html.
- `%context` — The original node that was passed to the evaluation engine before starting the evaluation.

The content of the `%context` variable depends on where the `constraints` property is actually defined. Here's an explanation:

Consider the FHIR R4 Patient schema, where `constraints` are located in the `contact` element:

```yaml
{{#include examples/patient-constraints.yaml}}
```

When processing the following data sample:

```yaml
{{#include examples/patient-constraints-context-variable.yaml}}
```

The FHIRPath evaluation engine will receive the following data node:

```yaml
{{#include examples/patient-constraints-context-variable-actual-node.yaml}}
```

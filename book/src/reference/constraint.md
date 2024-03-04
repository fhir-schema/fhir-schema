# Constraint

_Constraint_ is a component of the FHIR Schema that specifies FHIRPath constraints.

## Syntax

**[Constraint ID](#constraint-id)** property:
- `<your-constraint-id>` (string)

  **[Expression](#expression)** property:
  - `expression` (string)
  
  **[Human](#human)** property:
  - `human` (string)
  
  **[Severity](#severity)** property:
  - `severity` (string: error | warning | guideline)
  
## Constraint ID

A constraint ID must be unique within the constraints declaration scope. It serves as an identifier for the constraint, aiding in error identification by logging which constraint was violated.

## Expression

A FHIRPath expression. For technical details, please refer to the [ANSI FHIRPath specification](https://build.fhir.org/ig/HL7/FHIRPath/).

### Examples

Example of a constraint on the `contact` attribute in the FHIR R4 Patient schema:

```yaml
{{#include examples/patient-constraints.yaml}}
```

Data sample adhering to the previously mentioned schema:

```yaml
{{#include examples/patient-resource-constraints.yaml}}
```

Data sample not conforming to the previously mentioned schema:

```yaml
{{#include examples/invalid-patient-resource-constraints.yaml}}
```

## Variables in Expressions

The ANSI FHIRPath specification defines two environment variables for the FHIRPath engine's evaluation context:

- `%ucum` — URL for UCUM (`http://unitsofmeasure.org`), as per [HL7 UCUM](http://hl7.org/fhir/ucum.html).
- `%context` — The node evaluated by the engine at the start of evaluation.

FHIR extends FHIRPath with two additional variables:

- `%rootResource` — the container resource for `%resource`
- `%resource` — the resource containing the node in `%context`

### %ucum

Holds the URL `http://unitsofmeasure.org` for UCUM.

### %context

`%context` varies based on where the `constraints` property is defined:

#### Constraints at Specific Elements

For constraints in the `contact` element of the FHIR R4 Patient schema:

```yaml
{{#include examples/patient-constraints.yaml}}
```

With this data sample:

```yaml
{{#include examples/patient-constraints-context-variable.yaml}}
```

The FHIRPath engine processes this data node:

```yaml
{{#include examples/patient-constraints-context-variable-actual-node.yaml}}
```

#### Constraints at Top Level

For top-level constraints in the US Core 5.0.1 Patient schema:

```yaml
{{#include examples/patient-constraints-us-core.yaml}}
```

With this data sample:

```yaml
{{#include examples/patient-constraints-context-variable-2.yaml}}
```

The engine processes the entire resource as the data node:

```yaml
{{#include examples/patient-constraints-context-variable-actual-node-2.yaml}}
```

### %resource & %rootResource

These variables are similar to `%context` and vary based on schema location:

Consider this schema:

```yaml
{{#include examples/patient-constraints-fhir-variables.yaml}}
```

Testing against this data sample:

```yaml
{{#include examples/patient-constraints-fhir-variables-data-sample.yaml}}
```

#### cont-1 at `elements.contained.constraints`

Variables for cont-1:

**%context**:

```yaml
{{#include examples/patient-constraints-fhir-variables-context-cont-1.yaml}}
```

**%rootResource**:

```yaml
{{#include examples/patient-constraints-fhir-variables-rootResource-cont-1.yaml}}
```

**%resource**:

```yaml
{{#include examples/patient-constraints-fhir-variables-resource-cont-1.yaml}}
```

#### cont-2 at `elements.contained.name.constraints`

Variables for cont-2:

**%context**:

```yaml
{{#include examples/patient-constraints-fhir-variables-context-cont-2.yaml}}
```

**%rootResource**:

```yaml
{{#include examples/patient-constraints-fhir-variables-rootResource-cont-2.yaml}}
```

**%resource**:

```yaml
{{#include examples/patient-constraints-fhir-variables-resource-cont-2.yaml}}
```

#### cont-3 at `elements.generalPractitioner.constraints`

Variables for cont-3:

**%context**:

```yaml
{{#include examples/patient-constraints-fhir-variables-context-cont-3.yaml}}
```

**%rootResource**:

```yaml
{{#include examples/patient-constraints-fhir-variables-rootResource-cont-3.yaml}}
```

**%resource**:

```yaml
{{#include examples/patient-constraints-fhir-variables-resource-cont-3.yaml}}
```

## Human

This is a textual description of your constraint. While not mandatory, it is typically beneficial to include at least a brief explanation of your constraint.

## Severity

Types of constraint severity:

- **error**: Failing results in a validation error.
- **warning**
- **guideline**

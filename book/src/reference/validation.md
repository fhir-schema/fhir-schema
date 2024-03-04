# Validation

We will distinguish data elements, and schema elements. Data element is a part of the data, schema element is a part of schema.

## Concrete bases
Concrete data element bases are defined inductively:
1. For root data element _d_ it is a set _B_ of all root schemas reachable via the `base` property from the root schema _r_ for the data element _d_.
2. For any nested data element _d_ of an element _e_ it is a union of
   1. every nested element schema reachable from any concrete base _b_ of the parent element _e_ by following the corresponding property
   2. all concrete bases for schemas reachable from the nested element schema following the `type`, or `elementReference` properties.


## Data element validation
Data element is checked against each schema from its concrete element base.
Rules differ by JSON node type:
- Object:
  + Validate the object against each of its base schemas;
  + Validate every property of the object;
  + Check that each object property has at least one concrete base.
- Array: Validate every entry of the object.
- Other: Validate the node.

If the node is accepted by each schema, it is accepted, otherwise rejected.


## Primitive element validation
FHIR has a much wider types vocabulary than JSON. So, in addition to regular validation rules,
apply primitive datatype validation according to FHIR specification.

E.g. check format of a `dateTime` value, which is represented as a string `2024-02-30`.


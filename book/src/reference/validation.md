# Validation

We will distinguish data elements, and schema elements. Data element is a part of the data, schema element is a part of schema.

FHIR Schema uses differential schemas for data description.
To validate a data element we need to collect all element schemas covering this data element.

There are multiple properties which are used to refer other schema covering a data element.

Root schemas have a property referring to another schema: `base`.
Element schemas have 2 properties referring to another schemas: `type` and `elementReference`.

We will call a set of all schemas covering a data element a _schemata_.

## Schemata resolution
To resolve schemata we always start a root schema.
Consider two operations: _collect_ and _follow_.

The _collect_ operation accepts a set _S_ of schemas, and for each schema _s_
adds referred schemas to the set _S_.

More formally, let _getBaseSchema_ be a function which accepts a root schema and returns
- a singleton set with the schema referred by the `base` property,
  if both the property is present and the referred schema exists,
- empty set, otherwise

Let _getTypeSchema_ be a function which accepts an element schema and returns
- a singleton set with the schema referred by the `elementReference` property,
  if both the property is present and the referred schema exists,
- empty set, otherwise

Let _getElementReferenceSchema_ be a function which accepts an element schema and returns
- a singleton set with the schema referred by the `elementReference` property,
  if both the property is present and the referred schema exists,
- empty set, otherwise

Define
\\[
\operatorname{collect}(S) = \bigcup_{s \in S}
\begin{cases}
\\{s\\} \cup \operatorname{getBaseSchema}(s), \text{if s is a root schema},\\\\
\\{s\\} \cup \operatorname{getTypeSchema}(s) \cup \operatorname{getElementReferenceSchema}(s), \text{otherwise}.
\end{cases}
\\] 

The _follow_ operation accepts a set _S_ of schemas and a path item _p_, and for each schema _s_
it constructs a set _S'_ of schemas following the element _p_.

I.e.
\\[
\operatorname{follow}(S) = \bigcup_{s \in S}
\\{ s\texttt{.elements.}p \mid s\texttt{.elements.}p \text{ exists} \\}
\\] 

To resolve schemata for data element at path _P_,
1. Start with a singleton set with the root schema,
2. Repeat the _collect_ operation until the set stops growing
3. Take first path item _p_ from path _P_
4. Apply the _follow_ opertion using the schemata set
5. Repeat the _collect_ operation until the set stops growing
6. Repeat starting from 3. with remaining path


### Example
Consider US Core patient and name.given element
The schemata set changes:
1. start with US Core Patient schema
1. _collect_: US Core Patient schema, FHIR R4 patient schema
1. _collect_: US Core Patient, R4 Patient, R4 DomainResource
1. _collect_: US Core Patient, R4 Patient, R4 DomainResource, R4 Resource
1. _collect_: US Core Patient, R4 Patient, R4 DomainResource, R4 Resource
1. _collect_: US Core Patient, R4 Patient, R4 DomainResource, R4 Resource (stops growing)
1. _follow_: US Core Patient name element, R4 Patient name element
1. _collect_: US Core Patient name element, R4 Patient name element, R4 HumanName
1. _collect_: US Core Patient name element, R4 Patient name element, R4 HumanName, R4 Element
1. _collect_: US Core Patient name element, R4 Patient name element, R4 HumanName, R4 Element (stops growing)
1. _follow_: US Core Patient name.given element, R4 HumanName.given element
1. _collect_: US Core Patient name.given element, R4 HumanName.given element, R4 string
1. _collect_: US Core Patient name.given element, R4 HumanName.given element, R4 string, R4 element
1. _collect_: US Core Patient name.given element, R4 HumanName.given element, R4 string, R4 element (stops growing)



## Data element validation
Data element is checked against each schema from schemata.
Rules differ by JSON node type:
- Object:
  + Validate the object against each schema from schemata;
  + Validate every property of the object;
  + Check that each object property has non-empty schemata.
- Array: Validate every entry of the object.
- Other: Validate the node.

If the node is accepted by each schema, it is accepted, otherwise rejected.


## Primitive element validation
FHIR has a much wider types vocabulary than JSON. So, in addition to regular validation rules,
apply primitive datatype validation according to FHIR specification.

E.g. check format of a `dateTime` value, which is represented as a string `2024-02-30`.


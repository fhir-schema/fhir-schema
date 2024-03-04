# Slicing
Slicing is an *Element* property that dividing an arrays to sub-arrays with specific constraints on each sub-array.

## Syntax
- `slices` (object of *[Slice](slice.md)*)
- `ordered` (boolean)
- `rules` (string)

## Slicing order
Property `ordered` forces special order for slices. 

If the `ordered` property is true, each slice requires an `order` property, which is the number in the order of the slices. Items in the list must be ordered to match slices in the specified order.

### Example 
Schema
```yaml
elements: 
  address: 
    slicing:
      ordered: true
        slices:
          first:
            order: 0
            match:
              type: pattern
              value:
                use: home
          other:
            order: 1
            match:
              type: pattern
                value:
                  use: work
```

Invalid resource
```yaml
resourceType: Patient
address:
  - use: work
~    text: 534 Erewhon St PeasantVille, Rainbow, Vic  3999
  - use: home
~    text: Bos en Lommerplein 280
```


Valid resource
```yaml
resourceType: Patient
address:
  - use: home
~    text: Bos en Lommerplein 280
  - use: work
~    text: 534 Erewhon St PeasantVille, Rainbow, Vic  3999
```

Invalid resource
```yaml
resourceType: Patient
address:
  - use: home
~    text: Bos en Lommerplein 280
  - use: work
~    text: 534 Erewhon St PeasantVille, Rainbow, Vic  3999
  - use: home
~    text: Bos en Lommerplein 285
```

Valid resource
```yaml
resourceType: Patient
address:
  - use: home
~    text: Bos en Lommerplein 280
  - use: home
~    text: Bos en Lommerplein 285
  - use: work
~    text: 534 Erewhon St PeasantVille, Rainbow, Vic  3999
```

## Slicing rules 
The `rules` property specifies validation rules: 
- `open`: no additional restrictions will be imposed;
- `closed`: all items must match at least one slice;
- `openAtEnd`: all items that do not correspond to any slice must be at the end of the list. This option requires the `ordered` property to be true.

The default is `open`.
### Example
Schema with `closed` rules
```yaml
elements:
  address:
    slicing:
      rules: closed
      slices:
        home:
          match:
            type: pattern
            value:
              use: home
```

Invalid resource
```yaml
resourceType: Patient
address:
  - use: home
~    text: Bos en Lommerplein 280
  - use: work
~    text: 534 Erewhon St PeasantVille, Rainbow, Vic  3999
```

Valid resource
```yaml
resourceType: Patient
address:
  - use: home
~    text: Bos en Lommerplein 280
  - use: home
~    text: Bos en Lommerplein 285
```

Schema with `openAtEnd` rules
```yaml
elements:
  address:
    rules: openAtEnd
    ordered: true
    slices:
      home:
        order: 0
        match:
          type: pattern
          value:
            use: home
      work:
        order: 1
        match:
          type: pattern
          value:
            use: work
```

Invalid resource
```yaml
resourceType: Patient
address:
  - use: temp
~    text: 524 Erewhon St PeasantVille, Rainbow, Vic  3992
  - use: home
~    text: Bos en Lommerplein 280
  - use: work
~    text: 534 Erewhon St PeasantVille, Rainbow, Vic  3999
```

Valid resource
```yaml
resourceType: Patient
address:
  - use: home
~    text: Bos en Lommerplein 280
  - use: work
~    text: 534 Erewhon St PeasantVille, Rainbow, Vic  3999
  - use: temp
~    text: 524 Erewhon St PeasantVille, Rainbow, Vic  3992
```

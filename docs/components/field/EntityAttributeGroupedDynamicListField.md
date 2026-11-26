# **EntityAttributeGroupedDynamicListField 🗂️**

The **EntityAttributeGroupedDynamicListField** component renders one **multi-select dynamic list per item of a
collection** held by the entity: for instance zero or more roles assigned to each team of the
entity. Every item gets its own row, with its label and a dynamic list whose route depends on the item.

It is rendered by `EntityAttributeField` for attribute definitions declaring `input: 'GroupedDynamicList'`, and
therefore works in every generic form (`GenericCreationPage`, `GenericEditionPage`, `FormDialog`, ...).

---

## **🎯 Purpose**

- Repeat a multi-select [EntityAttributeDynamicListField](EntityAttributeDynamicListField.md) for each item of a
  collection of the entity (e.g. `entity.teams`), the list varying from one entity to another
- Render the route and the option templates of each list with its item as `item`, next to `entity`
- Store every selection in one value owned by the field: one `{ id, values }` entry per item
- Follow the collection: an item that appears starts with an empty selection, the selection of an item that
  disappears is dropped
- Participate in form validation through a `q-field` wrapper carrying the attribute rules
- Stack each item above its list on small screens

---

## **⚙️ Props**

The component accepts all props defined by `AttributeFieldProps<FieldGroupedDynamicListSettings>` — see
[EntityAttributeField](EntityAttributeField.md) for the common props (`instanceId`, `i18nScope`, `uiNamespace`,
`definition`, `entity`, `ignoreRules`).

### FieldGroupedDynamicListSettings

The `definition.inputSettings` object supports:

| Setting          | Type                       | Required | Default  | Description                                                                                 |
| ---------------- | -------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------- |
| `items`          | `string`                   | Yes      | -        | Dot-notation path of the collection in the entity; anything but an array is read as no item |
| `itemKey`        | `string`                   | No       | `id`     | Property of an item identifying it, copied into the stored value                            |
| `keyProperty`    | `string`                   | No       | `id`     | Property holding the item key in each entry of the stored value                             |
| `valuesProperty` | `string`                   | No       | `values` | Property holding the selected values in each entry of the stored value                      |
| `itemLabel`      | `string`                   | Yes      | -        | Nunjucks template of the item label, rendered with `{ entity, item }`                       |
| `itemCaption`    | `string`                   | No       | -        | Nunjucks template of the item caption, rendered with `{ entity, item }`                     |
| `field`          | `FieldDynamicListSettings` | Yes      | -        | Settings of the dynamic list of each item, always `multiple`, its templates reading `item`  |
| `ignoreRules`    | `boolean`                  | No       | `false`  | Bypasses the validation rules of the field                                                  |
| `disable`        | `boolean`                  | No       | `false`  | Renders the field and every list in a disabled state                                        |

`field` takes every setting of [EntityAttributeDynamicListField](EntityAttributeDynamicListField.md): `route`,
`routeDependencies`, `optionLabel`, `optionValue`, `optionDisabled`, `size`... `multiple` is always set.
`loadOnOpen` is `true` by default, so that a form opening with many items does not send one request per item: each
list loads its first page when it is opened, its preset values showing a placeholder until then, and a disabled list
loads as soon as it holds preset values. Set `loadOnOpen: false` to load every list when the form opens.

### Stored value

The field owns the whole value under `definition.name`, as an array of one entry per item, in the order of the
collection. With the default properties:

```json
[
  { "id": "TEAM_42", "values": ["ROLE_1", "ROLE_2"] },
  { "id": "TEAM_43", "values": [] }
]
```

- An entry is matched with its item by key, a number and its string being the same key
- `itemKey` must hold a unique value in every item: an item that is not an object, or whose key is `null`, `undefined`
  or an empty string, is skipped, and so is an item whose key an earlier item holds
- An item without entry starts with an empty selection; an entry without item is dropped
- An entry is kept as it is, its other properties and the type of its key included
- When the stored value does not match the collection (on the first render, or when the collection changes), the
  field emits the matching value; it emits nothing when it already holds one entry per item, whatever their order
- When `items` does not resolve to an array (an entity not loaded yet, a wrong path), the stored value is left as it
  is rather than erased
- The values keep their type: a number read as a string by the dynamic list is stored as a number again

A request body sends the value as is with a template reduced to one lookup, such as
`"teamRoles": "{{ entity.teamRoles }}"` in a `FormDialogButton` body. The value needs a JSON body: a `multipart`
form sends each entry as the string `[object Object]`.

### The list of each item

Each list is an `EntityAttributeDynamicListField` given:

- an entity holding only the selection of the item, in its `field` attribute, kept while that selection does not
  change, so that editing another attribute of the form does not render the options of every list again
- when a template or a dependency path of `field` names `entity`, the whole entity as `templateEntity`: the templates
  then read it as `entity`, every attribute included, and render their options again whenever it changes
- the context `{ item }`, so its templates read the item (`/api/teams/{{ item.id | urlencode }}/roles`)
- `ignoreRules`: the rules apply to the whole field, not to each list

---

## **📤 Events**

| Event           | Payload                   | Description                                                                         |
| --------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| `update:entity` | `Record<string, unknown>` | Emitted with the whole value when a selection changes, or when the collection does. |

---

## **🌍 Internationalization (i18n)**

### Translation Scope

```
{i18nScope}.fields.{definition.name}
```

### Supported Translation Keys

The list of each item is a field named `field` of the grouped field: like any field, it reads its keys under
`fields.field` of the scope of the grouped field.

| Key                         | Description                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `label`                     | Label of the field                                                                 |
| `hint`                      | Hint of the field                                                                  |
| `empty`                     | Message shown when the collection holds no item                                    |
| `validation.*`              | Messages of the rules of the field                                                 |
| `fields.field.label`        | Label of the list of each item, empty by default so the item label is not repeated |
| `fields.field.disabledText` | Caption under the options the lists disable                                        |
| `fields.field.noOption`     | Message of a list loaded without option, such as an item without profile           |
| `fields.field.validation.*` | Errors of the lists (`dynamicList.fetchError`, `dynamicList.missingRoute`)         |

```json
{
  "[INSTANCE_ID]": {
    "fields": {
      "teamRoles": {
        "label": "Roles",
        "hint": "Assign the roles available to each team",
        "empty": "This entity has no team",
        "validation": { "required": "At least one role must be assigned" },
        "fields": {
          "field": { "disabledText": "Already assigned elsewhere" }
        }
      }
    }
  }
}
```

---

## **🎨 UI Customization**

### Namespace Resolution

```
{uiNamespace}.{definition.name}
```

### Applied Components

| Namespace                                             | Component                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `<ns>.<name>`                                         | `q-field`                                                          |
| `<ns>.<name>.list`                                    | `q-list`                                                           |
| `<ns>.<name>.item`                                    | `q-item` of each item                                              |
| `<ns>.<name>.item-section`                            | `q-item-section` of the item label and caption                     |
| `<ns>.<name>.item-label`                              | `q-item-label` of the item label                                   |
| `<ns>.<name>.item-caption`                            | `q-item-label` of the item caption (`caption`)                     |
| `<ns>.<name>.field-section`                           | `q-item-section` of the list of each item                          |
| `<ns>.<name>.empty`                                   | `q-item` of the empty state                                        |
| `<ns>.<name>.empty-avatar` / `<ns>.<name>.empty-icon` | `q-item-section` (`avatar`) / `q-icon` (`info`) of the empty state |
| `<ns>.<name>.empty-message`                           | `q-item-section` of the empty message                              |
| `<ns>.<name>.field`                                   | `q-select` of each list, and its other entries                     |

### Layout

Each item is a row: its label and caption take a third of the width and its list the rest (`col-sm-4` /
`col-sm-8`); below the `sm` breakpoint, the label is stacked above the list (`col-12`). The item wraps, unlike a
default `q-item`, and its two sections have no margin between them. The items have no horizontal padding, so that their
labels line up with the other fields of the form, and the list has no border (`bordered` and `separator` can be set on
`<ns>.<name>.list`). The lists keep no space below them for a hint or an error, so that each one is centred on the label
of its item. The field shows its error under the items, without an error icon, which would narrow them when it appears.

---

## **✅ Validation**

The rules come from `useQuasarRules` with the attribute definition, and are carried by the `q-field`, so that the
form blocks its submission:

- `required` checks **every selected value of every item, as one flat list**: it fails when no value is selected at
  all (an empty array is missing from lin-pulsar-core 0.1.11)
- `hasValidations` sends the stored value, `[{ id, values }]`, to the API validation, as the form sends it

`ignoreRules`, as a prop or a setting, removes them.

---

## **🧭 Nested Attributes**

`definition.name` and `items` accept dot-notation paths (`extraParameters.teamRoles`,
`structure.teams`), read and written with `getNestedValue` / `setNestedValue`.

---

## **Example Configuration**

```json
{
  "name": "teamRoles",
  "type": "Array",
  "required": true,
  "hasValidations": false,
  "input": "GroupedDynamicList",
  "inputSettings": {
    "items": "teams",
    "itemLabel": "{{ item.name }}",
    "itemCaption": "{{ item.code }}",
    "keyProperty": "teamId",
    "valuesProperty": "roleIds",
    "field": {
      "route": "/api/teams/{{ item.id | urlencode }}/roles",
      "routeDependencies": ["item.id"],
      "optionLabel": "{{ name }}",
      "optionValue": "{{ id }}",
      "size": 20
    }
  }
}
```

The entity `{ teams: [{ id: 'TEAM_42', name: 'Support', code: 'SUP-01' }] }` renders one row,
"Support" over "SUP-01", and its list loads `/api/teams/TEAM_42/roles` when it is opened. The
field stores `[{ "teamId": "TEAM_42", "roleIds": [] }]` until roles are picked.

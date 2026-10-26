# **LinPulsarSmartFilter**

The **LinPulsarSmartFilter** component provides a filtering interface with a toggle-able menu. It allows users to select and manage active filters, and save filter configurations.

---

## **Purpose**

- Provide a reusable filtering component for search and data filtering
- Support dynamic filter options and saved filter sets
- Manage the relationship between available filters, active filters, and saved configurations
- Provide a consistent UI/UX for filtering across the application

---

## **Props**

| Prop               | Type                                                                 | Required | Default | Description                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiNamespace`      | `string`                                                             | Yes      | -       | UI design namespace for styling and configuring the component through the design system.                                                                                                             |
| `i18nScope`        | `string`                                                             | Yes      | -       | i18n scope for localizing strings within the component.                                                                                                                                              |
| `filters`          | `LinPulsarFilter[]`                                                  | No       | -       | Active filters currently applied. This is the controlled state: the parent passes back the array received from `update:filters`. Only filters with non-empty values are included.                    |
| `options`          | `{ filters?: LinPulsarFilter[]; filterSets?: LinPulsarFilterSet[] }` | No       | -       | Available filter definitions (`options.filters`) and saved filter configurations (`options.filterSets`). `options.filters` is the full catalog of filters the user can apply.                        |
| `isMenuPersistent` | `boolean`                                                            | No       | `false` | When `true`, the dropdown menu ignores outside clicks and stays open. Useful when a dialog opened from inside the menu (e.g. a confirmation or form dialog) would otherwise cause the menu to close. |

---

## **Events**

| Event               | Payload              | Description                                                                                                                                                     |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `update:filters`    | `LinPulsarFilter[]`  | Emitted whenever the user applies a filter, removes one, or clears them all. The payload contains only the filters that have at least one active value applied. |
| `apply:favorite`    | `LinPulsarFilterSet` | Emitted when a favorite filter set is applied. The payload contains the applied favorite filter set.                                                            |
| `delete:favorite`   | `LinPulsarFilterSet` | Emitted when a favorite filter set is deleted. The payload contains the deleted favorite filter set.                                                            |
| `create:favorite`   | -                    | Emitted when the user wants to create a new favorite filter set.                                                                                                |
| `override:favorite` | -                    | Emitted when the user wants to override an existing favorite filter set.                                                                                        |

---

## **Architecture Overview**

The component separates two concerns that are easy to conflate:

- **`options.filters`** defines _which filters exist_ — their type, their label, and any type-specific configuration (e.g. the list of items for a `list` filter). This is the catalog. It is provided once by the parent and never changes at runtime.
- **`filters`** carries _which filters are active_ — only those to which the user has applied at least one value. This is the controlled state: the parent receives it via `update:filters` and passes it back as a prop on the next render.

When the user applies or removes a filter, the component emits `update:filters`. The parent must pass the updated array back via the `filters` prop for the chips to reflect the new state.

### Component structure

```
LinPulsarSmartFilter
├── Search field (always visible)
│   ├── Search icon (left)
│   ├── Active filter chips (one per applied filter)
│   └── Dropdown arrow (right)
└── Dropdown menu (opens on click)
    └── Filter panel
        ├── Filter list (left column — one entry per available filter)
        └── Filter editor (right column — changes based on the selected filter type)
```

---

## **Filter Type → Panel Mapping**

When the user selects a filter in the left column, the editor on the right displays a panel adapted to the filter's type:

| Filter type | Editor UI                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------- |
| `text`      | Text input with operator options (contains, starts with, …) and a negation toggle           |
| `number`    | Numeric input with operator options (less than, greater than, equals) and a negation toggle |
| `date`      | Date input with a date picker, operator options, and a negation toggle                      |
| `list`      | Checkbox list of predefined items                                                           |
| `tree`      | Hierarchical tree selector                                                                  |

Switching from one filter to another always resets the editor to its initial state, even if both filters share the same type.

---

## **Event Flow**

### Applying a filter

1. The user selects a filter in the left column, fills in the editor, and clicks **Search**.
2. The component emits `update:filters` with all currently active filters (including the newly applied one).
3. The parent updates its state and passes the new array back as `:filters`.
4. The chip for that filter appears.
5. The menu closes and the filter selection is reset — reopening the menu shows no filter pre-selected.

### Switching between filters

1. The user clicks a different filter name in the left column.
2. The editor on the right is replaced with a fresh panel for the newly selected filter.
3. Any previously typed values in the old panel are discarded — they are not applied until the user explicitly clicks **Search**.

### Closing the menu without applying

If the user closes the menu without clicking **Search** (clicking outside, pressing Escape), the filter selection is reset. Reopening the menu shows no filter pre-selected, and any values typed in the editor are lost.

---

## **Chip Lifecycle**

Each applied filter is displayed as a chip in the search field. The chip shows the filter label and its current value(s).

**A chip appears** when the user clicks **Search** in the editor with at least one value entered — a new, independent chip, even if a chip for the same filter already exists. Searching the same filter multiple times produces multiple separate chips, each with its own value(s), rather than merging into a single chip. Clicking **Search** with an empty editor has no effect — no chip is created.

**A chip disappears** when the user clicks × on it. The filter's values are cleared and `update:filters` is emitted with the remaining active filters.

**A chip never grows wider than the search field**: whatever the number of values it holds, its content wraps onto as many lines as needed and the chip grows in height instead of overflowing. A value long enough to fill a line on its own — an unresolved identifier, typically — is broken rather than pushed outside.

**All chips disappear at once** when the user clicks the × displayed at the right of the search field. That icon is only rendered while at least one filter is active, and clicking it emits `update:filters` with an empty array without opening the menu.

### Dynamic value labels

A filter holding identifiers — an organizational unit id, for instance — would display raw UUIDs in its chip. When its definition carries `dynamicLabelOptions`, the chip resolves the item behind each value and displays it with the `value` translation key, whose named parameters are the fields of the resolved item.

By default a single request resolves every value at once, against an endpoint returning a collection:

```json
{
  "name": "organizationalUnitId",
  "type": "tree",
  "dynamicLabelOptions": {
    "url": "/organizational-units?id={{ values | join('|') }}",
    "responseItemsPath": "content",
    "valuePath": "id"
  }
}
```

With `multipleRequests: true`, one request is performed per value, against an endpoint returning a single item — the whole response — so `responseItemsPath` and `valuePath` are not used:

```json
{
  "name": "organizationalUnitId",
  "type": "tree",
  "dynamicLabelOptions": {
    "multipleRequests": true,
    "url": "/organizational-units/{{ value }}"
  }
}
```

Both work with the matching translation:

```json
{
  "[INSTANCE_ID]": {
    "LinPulsarSmartFilter": {
      "LinPulsarFilterChip": {
        "organizationalUnitId": {
          "value": "{name}"
        }
      }
    }
  }
}
```

- Only the values missing an item are requested: a chip whose values are all resolved performs no request, and a resolved item is never requested again as long as its `LinPulsarFilterValue` instance lives. Favorites rebuild their filters whenever the user preferences change, so their chips resolve their values again.
- The tree panel already holds every node, so when the filter defines `dynamicLabelOptions` it attaches each ticked node to its value as the item: applying such a tree filter displays the labels without any request. Without `dynamicLabelOptions`, the values are emitted bare, as every other panel does.
- With `multipleRequests` left to its default, a single request sized to the number of unresolved values resolves them all at once. The next pages are requested while the API answers `206 Partial Content`, the page is not marked `last` and the page resolved at least one value — the API answers `206` whenever the collection spans several pages, including on the last one, so the status alone is not enough. With `multipleRequests: true`, one request per value is performed and the whole response becomes the item.
- The values are percent-encoded before the template is rendered, and the query string of the rendered URL is encoded again afterwards: a `&`, `=` or `|` inside a value cannot be confused with the syntax around it, and the `|` separator joining the values reaches the API as `%7C`, which servers such as Tomcat require. Write the template with the separator as-is — a `| urlencode` filter would encode the already encoded values a second time.
- A spinner replaces each unresolved value while the requests are running.
- A value that cannot be resolved — no `dynamicLabelOptions`, no `value` translation key, or a failed request — falls back to its raw value, so the chip always stays readable.
- Only the top-level fields of the item can be displayed: vue-i18n rejects dotted paths such as `{item.name}` in a placeholder.

The `dynamicLabelOptions` contract itself is documented in the lin-pulsar-core `docs/filters.md`.

---

## **Example Usage**

### Minimal

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { LinPulsarFilter, LinPulsarFilterSet } from '@linagora/lin-pulsar-core';

const filters = ref([]);

const filterDefinitions = [new LinPulsarFilter('firstname', 'text', { fieldName: 'firstname' }, []), new LinPulsarFilter('lastname', 'text', { fieldName: 'lastname' }, [])];
const filterSet = [new LinPulsarFilterSet('id', 'label', [])];

function onUpdateFilters(updated) {
  filters.value = updated;
}
</script>

<template>
  <lin-pulsar-smart-filter
    ui-namespace="myApp"
    i18n-scope="myScope"
    :filters="filters"
    :options="{ filters: filterDefinitions, filterSet: filterSets }"
    @update:filters="onUpdateFilters"
  />
</template>
```

### With all filter types

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { LinPulsarFilter, LinPulsarFilterSet } from '@linagora/lin-pulsar-core';

const filters = ref([]);

const filterDefinitions = [
  new LinPulsarFilter('username', 'text', { fieldName: 'username' }, []),
  new LinPulsarFilter('age', 'number', { fieldName: 'age' }, []),
  new LinPulsarFilter('createdAt', 'date', { fieldName: 'createdAt', maskI18NKey: 'application.dateFormat' }, []),
  new LinPulsarFilter(
    'status',
    'list',
    {
      fieldName: 'status',
      items: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Deactivated', value: 'deactivated' },
      ],
    },
    []
  ),
  new LinPulsarFilter(
    'ou',
    'tree',
    {
      fieldName: 'ou',
      items: [{ type: 'ou', key: 'ou=root', value: 'Root', nodes: [{ type: 'ou', key: 'ou=engineering', value: 'Engineering', nodes: [] }] }],
    },
    []
  ),
];
const filterSet = [new LinPulsarFilterSet('id', 'label', [])];
</script>

<template>
  <lin-pulsar-smart-filter
    ui-namespace="myApp"
    i18n-scope="myScope"
    :filters="filters"
    :options="{ filters: filterDefinitions, filterSet: filterSets }"
    @update:filters="filters = $event"
  />
</template>
```

> **Note:** `LinPulsarFilter` auto-generates a stable `id` via `crypto.randomUUID()` at construction time. Define the filter instances once (outside `setup` or in a constant) to prevent `id` regeneration on every render — each active filter chip is keyed by `id`, so regeneration would cause the chip list to unnecessarily re-render.

---

## **Types**

All types are exported from the component's type definition file:

### `LinPulsarSmartFilterProps`

Extends `CommonComponentProps` from the lin-pulsar-core:

```typescript
export interface LinPulsarSmartFilterProps extends CommonComponentProps {
  /**
   * Active filters currently applied. Only filters with non-empty values are included.
   * This is the controlled state: the parent passes back the value received from `update:filters`.
   */
  filters?: LinPulsarFilter[];

  /**
   * Available filter definitions and saved filter sets.
   */
  options?: {
    /**
     * Full catalog of filters the user can apply. Each entry defines the filter type,
     * its field name, and any type-specific options (e.g. list items, date mask).
     */
    filters?: LinPulsarFilter[];

    /**
     * Saved search configurations the user can restore.
     */
    filterSets?: LinPulsarFilterSet[];
  };

  /**
   * Determines whether the filter menu should remain open.
   * Set to `true` before opening a dialog triggered from inside the menu to prevent
   * the menu from closing when focus moves to the dialog. Reset to `false` in the
   * dialog's `afterClose` callback.
   */
  isMenuPersistent?: boolean;
}
```

### `LinPulsarSmartFilterOutputs`

```typescript
export type LinPulsarSmartFilterOutputs = {
  /**
   * Emitted when the user applies or removes a filter.
   * The payload contains only the filters with at least one active value.
   */
  (e: 'update:filters', filters: LinPulsarFilter[]): void;
};
```

---

## **UI Customization**

The component uses the LinPulsar design system through `useUiDesign()` and applies props to Quasar components:

| Namespace Path                                                                                  | Target           | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `{uiNamespace}.lin-pulsar-smart-filter`                                                         | `q-field`        | Filter field container styling and configuration                                                            |
| `{uiNamespace}.lin-pulsar-smart-filter`                                                         | `q-menu`         | Dropdown menu styling and configuration                                                                     |
| `{uiNamespace}.lin-pulsar-smart-filter`                                                         | `q-separator`    | Separator between panel in menu.                                                                            |
| `{uiNamespace}.lin-pulsar-smart-filter.iconSearch`                                              | `q-icon`         | Search icon styling                                                                                         |
| `{uiNamespace}.lin-pulsar-smart-filter.iconClear`                                               | `q-icon`         | Clear icon styling (removes every active filter)                                                            |
| `{uiNamespace}.lin-pulsar-smart-filter.iconMenuClose`                                           | `q-icon`         | Right dropdown icon styling (menu open)                                                                     |
| `{uiNamespace}.lin-pulsar-smart-filter.iconMenuOpen`                                            | `q-icon`         | Right dropdown icon styling (menu closed)                                                                   |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-chip.[FILTER]`                         | `q-chip`         | Configures the chip container that displays the selected values associated with a specific filter field.    |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-chip.[FILTER]`                         | `q-avatar`       | Configures the avatar section of the chip, which displays the filter field name before the selected values. |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-chip.[FILTER]`                         | `q-spinner`      | Configures the spinner displayed in place of a value while its item is being resolved.                      |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-panel.header`                          | `q-icon`         | Icon displayed in the panel title bar                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-panel.header`                          | `q-separator`    | Horizontal separator below the panel title                                                                  |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-panel.content`                         | `q-list`         | Filter navigation list styling                                                                              |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-panel.content`                         | `q-item`         | Filter item styling                                                                                         |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-panel.content`                         | `q-separator`    | Vertical separator between the filter list and the editor area                                              |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-panel.content.icon-section`            | `q-item-section` | Avatar section of a filter item (icon)                                                                      |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-panel.content.label-section`           | `q-item-section` | Label section of a filter item (name)                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-filter-panel.content.types.[FILTER_TYPE]`     | `q-icon`         | Icon displayed next to a filter of a given type                                                             |
| `{uiNamespace}.lin-pulsar-smart-filter.text-search-filter-panel`                                | `q-input`        | Text input field styling                                                                                    |
| `{uiNamespace}.lin-pulsar-smart-filter.text-search-filter-panel`                                | `q-checkbox`     | Negation checkbox styling                                                                                   |
| `{uiNamespace}.lin-pulsar-smart-filter.text-search-filter-panel`                                | `q-option-group` | Operator radio group styling                                                                                |
| `{uiNamespace}.lin-pulsar-smart-filter.text-search-filter-panel`                                | `q-btn`          | Search button styling                                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.number-search-filter-panel`                              | `q-input`        | Numeric input field styling                                                                                 |
| `{uiNamespace}.lin-pulsar-smart-filter.number-search-filter-panel`                              | `q-checkbox`     | Negation checkbox styling                                                                                   |
| `{uiNamespace}.lin-pulsar-smart-filter.number-search-filter-panel`                              | `q-option-group` | Operator radio group styling                                                                                |
| `{uiNamespace}.lin-pulsar-smart-filter.number-search-filter-panel`                              | `q-btn`          | Search button styling                                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.list-search-filter-panel`                                | `q-list`         | List items container styling                                                                                |
| `{uiNamespace}.lin-pulsar-smart-filter.list-search-filter-panel`                                | `q-item`         | List item styling                                                                                           |
| `{uiNamespace}.lin-pulsar-smart-filter.list-search-filter-panel.checkboxSection`                | `q-item-section` | Checkbox area styling                                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.list-search-filter-panel.checkboxSection`                | `q-checkbox`     | Checkbox styling                                                                                            |
| `{uiNamespace}.lin-pulsar-smart-filter.list-search-filter-panel.labelSection`                   | `q-item-section` | Label area styling                                                                                          |
| `{uiNamespace}.lin-pulsar-smart-filter.list-search-filter-panel`                                | `q-btn`          | Search button styling                                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.header`                        | `q-icon`         | Icon displayed in the panel title bar                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.header`                        | `q-separator`    | Horizontal separator below the panel title                                                                  |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content`                       | `q-list`         | Favorites navigation list styling                                                                           |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content`                       | `q-item`         | Favorites item styling                                                                                      |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content`                       | `q-separator`    | Vertical separator between the favorites list and the editor area                                           |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.icon-section`          | `q-item-section` | Avatar section of a favorite item                                                                           |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.icon-section`          | `q-icon`         | Avatar section of a favorite item (icon)                                                                    |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.label-section`         | `q-item-section` | Label section of a favorite item (name)                                                                     |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.override-section`      | `q-item-section` | Section containing the override button (replace current filters with this favorite)                         |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.override-section`      | `q-btn`          | Override button styling (replace current filters with this favorite)                                        |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.rename-section`        | `q-item-section` | Section containing the rename button (rename this favorite)                                                 |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.rename-section`        | `q-btn`          | Rename button styling (edit favorite name)                                                                  |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.delete-section`        | `q-item-section` | Section containing the delete button (remove this favorite)                                                 |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.delete-section`        | `q-btn`          | Delete button styling (remove this favorite)                                                                |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.no-data-icon-section`  | `q-item-section` | Avatar section for no-data item                                                                             |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.no-data-icon-section`  | `q-icon`         | Avatar section for no-data item (icon)                                                                      |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.no-data-label-section` | `q-item-section` | Label section for no-data item (name)                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.lin-pulsar-favorite-panel.content.create-button`         | `q-btn`          | Create favorite button styling                                                                              |
| `{uiNamespace}.lin-pulsar-smart-filter.tree-search-filter-panel`                                | `GenericTree`    | Tree component styling and configuration                                                                    |
| `{uiNamespace}.lin-pulsar-smart-filter.tree-search-filter-panel`                                | `q-btn`          | Search button styling                                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.date-search-filter-panel`                                | `q-input`        | Date text input field styling                                                                               |
| `{uiNamespace}.lin-pulsar-smart-filter.date-search-filter-panel`                                | `q-icon`         | Calendar icon trigger styling                                                                               |
| `{uiNamespace}.lin-pulsar-smart-filter.date-search-filter-panel`                                | `q-date`         | Date picker styling                                                                                         |
| `{uiNamespace}.lin-pulsar-smart-filter.date-search-filter-panel`                                | `q-checkbox`     | Negation checkbox styling                                                                                   |
| `{uiNamespace}.lin-pulsar-smart-filter.date-search-filter-panel`                                | `q-option-group` | Operator radio group styling                                                                                |
| `{uiNamespace}.lin-pulsar-smart-filter.date-search-filter-panel`                                | `q-btn`          | Search button styling                                                                                       |
| `{uiNamespace}.lin-pulsar-smart-filter.date-search-filter-panel.close`                          | `q-btn`          | Date picker close button styling                                                                            |

- **Design Configuration Example:** See [design.md](../../design.md#LinPulsarSmartFilter).

---

## **Internationalization**

The component uses scoped i18n with the following translation keys:

| Key                                                                                 | Description                                               | Usage                  | Parameters |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- | ---------- |
| `[INSTANCE_ID].LinPulsarSmartFilter.label`                                          | Filter field label (optional)                             | Input label            | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.hint`                                           | Helper text for the filter (optional)                     | Input hint             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.prefix`                                         | Input prefix (optional)                                   | Input prefix           | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.suffix`                                         | Input suffix (optional)                                   | Input suffix           | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFilterChip.[FILTER].type`              | Filter type label (optional, default filter.name)         | Filter label           | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFilterChip.[FILTER].separator`         | Separator between filter values                           | Filter separator label | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFilterChip.[FILTER].value`             | Label of a resolved value (optional)                      | Filter value label     | Item keys  |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFilterPanel.title`                     | Panel section title                                       | Header title           | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFilterPanel.columnFilter.[columnName]` | Column filter label                                       | Column filter label    | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.inputLabel`               | Text input label (optional, defaults to empty string)     | QInput label           | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.inputHint`                | Text input hint (optional, defaults to empty string)      | QInput hint            | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.inputPrefix`              | Text input prefix (optional, defaults to empty string)    | QInput prefix          | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.inputSuffix`              | Text input suffix (optional, defaults to empty string)    | QInput suffix          | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.negateLabel`              | Negation checkbox label                                   | QCheckbox label        | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.searchButton`             | Search button label                                       | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.operators.contains`       | "contains" operator label                                 | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.operators.startsWith`     | "startsWith" operator label                               | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.operators.endsWith`       | "endsWith" operator label                                 | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.operators.equals`         | "equals" operator label                                   | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.operators.notContains`    | Negated "contains" label                                  | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.operators.notStartsWith`  | Negated "startsWith" label                                | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.operators.notEndsWith`    | Negated "endsWith" label                                  | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TextSearchFilterPanel.operators.notEquals`      | Negated "equals" label                                    | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.inputLabel`             | Numeric input label (optional, defaults to empty string)  | QInput label           | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.inputHint`              | Numeric input hint (optional, defaults to empty string)   | QInput hint            | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.inputPrefix`            | Numeric input prefix (optional, defaults to empty string) | QInput prefix          | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.inputSuffix`            | Numeric input suffix (optional, defaults to empty string) | QInput suffix          | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.negateLabel`            | Negation checkbox label                                   | QCheckbox label        | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.searchButton`           | Search button label                                       | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.operators.inferior`     | "inferior" operator label                                 | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.operators.superior`     | "superior" operator label                                 | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.operators.equals`       | "equals" operator label                                   | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.operators.notInferior`  | Negated "inferior" label                                  | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.operators.notSuperior`  | Negated "superior" label                                  | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.NumberSearchFilterPanel.operators.notEquals`    | Negated "equals" label                                    | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFavoritePanel.title`                   | Panel section title                                       | Header title           | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFavoritePanel.noData`                  | No data panel section                                     | No data label          | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFavoritePanel.createFavorite`          | Label for create button                                   | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFavoritePanel.overrideButton`          | Label for override button (replace current filters)       | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFavoritePanel.renameButton`            | Label for rename button (edit favorite name)              | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.LinPulsarFavoritePanel.deleteButton`            | Label for delete button (remove favorite)                 | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TreeSearchFilterPanel.searchButton`             | Search button label                                       | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.TreeSearchFilterPanel.errorLoadingData`         | Error message when failing to load tree data              | Notification message   | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.ListSearchFilterPanel.searchButton`             | Search button label                                       | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.inputLabel`               | Date input label (optional, defaults to empty string)     | QInput label           | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.inputHint`                | Date input hint (optional, defaults to empty string)      | QInput hint            | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.inputPrefix`              | Date input prefix (optional, defaults to empty string)    | QInput prefix          | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.inputSuffix`              | Date input suffix (optional, defaults to empty string)    | QInput suffix          | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.negateLabel`              | Negation checkbox label                                   | QCheckbox label        | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.close`                    | Date picker close button label                            | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.searchButton`             | Search button label                                       | QBtn label             | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.operators.inferior`       | "inferior" operator label                                 | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.operators.superior`       | "superior" operator label                                 | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.operators.equals`         | "equals" operator label                                   | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.operators.notInferior`    | Negated "inferior" label                                  | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.operators.notSuperior`    | Negated "superior" label                                  | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.operators.notEquals`      | Negated "equals" label                                    | Radio option label     | -          |
| `[INSTANCE_ID].LinPulsarSmartFilter.DateSearchFilterPanel.validation.invalidDate`   | Invalid date format error message                         | QInput validation rule | `format`   |

Example:

```json
{
  "[INSTANCE_ID]": {
    "LinPulsarSmartFilter": {
      "label": "Search",
      "hint": "Enter your search criteria",
      "prefix": "",
      "suffix": "",
      "LinPulsarFilterChip": {
        "[FILTER]": {
          "type": "Filter name",
          "separator": "or",
          "value": "{name}"
        }
      },
      "LinPulsarFilterPanel": {
        "title": "Filter By"
      },
      "LinPulsarFavoritePanel": {
        "title": "Favorites",
        "noData": "No available favorites",
        "createFavorite": "Create Favorite",
        "overrideFavorite": "Override Favorite",
        "deleteButton": "Delete"
      },
      "TextSearchFilterPanel": {
        "inputLabel": "Value",
        "inputHint": "Enter a value to search",
        "inputPrefix": "~",
        "inputSuffix": "*",
        "negateLabel": "Negate",
        "searchButton": "Search",
        "operators": {
          "contains": "contains",
          "startsWith": "startsWith",
          "endsWith": "endsWith",
          "equals": "equals",
          "notContains": "not contains",
          "notStartsWith": "not startsWith",
          "notEndsWith": "not endsWith"
        }
      },
      "NumberSearchFilterPanel": {
        "inputLabel": "Value",
        "inputHint": "Enter a number to search",
        "inputPrefix": "$",
        "inputSuffix": "kg",
        "negateLabel": "Negate",
        "searchButton": "Search",
        "operators": {
          "inferior": "inferior",
          "superior": "superior",
          "equals": "equals",
          "notInferior": "not inferior",
          "notSuperior": "not superior",
          "notEquals": "not equals"
        }
      },
      "TreeSearchFilterPanel": {
        "searchButton": "Search",
        "errorLoadingData": "Failed to load tree data."
      },
      "ListSearchFilterPanel": {
        "searchButton": "Search"
      },
      "DateSearchFilterPanel": {
        "inputLabel": "Date",
        "inputHint": "Select or enter a date",
        "inputPrefix": "≥",
        "inputSuffix": "(UTC)",
        "negateLabel": "Negate",
        "close": "Close",
        "searchButton": "Search",
        "operators": {
          "inferior": "inferior",
          "superior": "superior",
          "equals": "equals",
          "notInferior": "not inferior",
          "notSuperior": "not superior",
          "notEquals": "not equals"
        },
        "validation": {
          "invalidDate": "Invalid date. Expected format: {format}"
        }
      }
    }
  }
}
```

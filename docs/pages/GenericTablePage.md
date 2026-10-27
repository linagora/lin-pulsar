# **GenericTablePage**

The **GenericTablePage** component provides a reusable, federated page template for displaying and managing tabular data.

It is designed to work with Module Federation-based modules and relies on a host-provided configuration to dynamically render:

- table structure
- data loading
- navigation behavior
- optional action panel
- optional, URL-synced filter panel

---

## **Purpose**

- Provide a standard table-based page layout across modules
- Abstract pagination, data fetching, and routing logic
- Integrate seamlessly with Module Federation configuration
- Support optional actions via a configurable action card
- Support optional filtering via a configurable smart filter, synced with the URL
- Enable consistent navigation to entity creation and detail pages
- Ensure full compatibility with Quasar QTable ecosystem

---

## **Configuration**

The component is driven by `ModuleGenericTablePageOptions`:

```ts
interface ModuleGenericTablePageOptions {
  idKey: string;
  columns: GenericTableColumn[];
  enableActions: boolean;
  enableSeeButton?: boolean;
  creationPagePath: string;
  keepQueryParams?: string[];
  filters?: LinPulsarFilter[];
  reloadTableOn?: string[];
}
```

### **Options**

| Option             | Type                   | Description                                                                                                                       |
| ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `idKey`            | `string`               | Key used to identify each row and build detail routes                                                                             |
| `columns`          | `GenericTableColumn[]` | Table column definitions (extends Quasar QTableColumn with formatting options)                                                    |
| `enableActions`    | `boolean`              | Enables or disables the actions card above the table                                                                              |
| `enableSeeButton`  | `boolean`              | Optional. Shows the per-row "see" button unless explicitly set to `false`                                                         |
| `creationPagePath` | `string`               | Route path used for the "create" button navigation                                                                                |
| `keepQueryParams`  | `string[]`             | Optional. URL query parameter keys to preserve as-is when the active filters are synced to the URL                                |
| `filters`          | `LinPulsarFilter[]`    | Optional. Filter definitions rendered by `LinPulsarSmartFilter`. Omitted or empty disables the smart filter                       |
| `reloadTableOn`    | `string[]`             | Optional. UI event keys (from the `uiEventSubject` bus) triggering a reload of the table data (see [Data Loading](#data-loading)) |

---

## **Column Formatting**

See [Value Formatting](../value-formatting.md) for details on supported formatters and configuration.

### **Example Configuration**

```ts
{
  columns: [
    {
      name: 'id',
      label: 'generic.table.columns.id',
      field: 'id',
    },
    {
      name: 'createdAt',
      label: 'generic.table.columns.createdAt',
      field: 'createdAt',
      formatter: 'toDate',
      formatOptions: { formatKey: 'application.dateTimeFormat' },
    },
    {
      name: 'updatedAt',
      label: 'generic.table.columns.updatedAt',
      field: 'updatedAt',
      formatter: 'toDate',
      formatOptions: { formatKey: 'application.dateFormat' },
    },
  ];
}
```

#### **Example i18n Configuration**

```json
{
  "application": {
    "dateTimeFormat": "DD/MM/YYYY HH:mm:ss",
    "dateFormat": "DD/MM/YYYY"
  }
}
```

---

## **Layout Structure**

The page is composed of four main sections:

### **1. Header (optional)**

Displayed only if a translation key `title` exists.

- Title is resolved via scoped i18n (`instanceId`)
- Rendered as a page header

---

### **2. Actions Section (optional)**

Rendered only when `enableActions = true`.

Includes:

- `ButtonsCard` (local `LinPulsar` component, directly imported)
- Extension zone for additional buttons, rendered via `LinPulsarZoneRenderer` (Module Federation)
- A default **Create button**

#### **Create button behavior**

- Navigates to `creationPagePath`
- Fully configurable via Module Federation options
- Styled via design system (`buttons-card.create-button`)

---

### **3. Filter Section (optional)**

Rendered only when `options.filters` is a non-empty array.

Includes:

- `LinPulsarSmartFilter` (federated component)
- Active filters are initialized from the URL query params on mount
- Filter changes reset pagination to page 1, sync the URL, and reload the table data

See [LinPulsarSmartFilter](../components/smart-filter/LinPulsarSmartFilter.md) for the filtering UI itself.

---

### **4. Table Section**

Renders a table component:

- `GenericEntityTable` (local `LinPulsar` component, directly imported)
- Supports pagination
- Supports dynamic column labels (i18n scoped)
- Uses `idKey` to identify rows

#### **Row rendering**

Each row includes:

- dynamic cells based on column definition
- a **See button** for navigation to detail page, hidden only when the optional `enableSeeButton` option is explicitly set to `false`

---

## **Navigation Behavior**

Both buttons are links handled by the Vue Router: a click navigates in the single-page application, while `Ctrl`, `Cmd` or middle click opens the page in a new tab and the browser context menu actions keep working.

### **Create Navigation**

The create button links to the configured path:

```vue
<q-btn :to="creationPagePath" />
```

---

### **Detail Navigation**

The "See" button of each row links to the detail page of its item:

```vue
<q-btn :to="`${parentPath}/${row[idKey]}`" />
```

- `idKey` is used to extract the row identifier
- Navigation is relative to the parent route

---

## **Data Loading**

Data is fetched using:

- `getEntities(instanceId)`
- pagination mapping utilities

### **Flow**

1. Component mounts
2. `loadData()` is called
3. API request is executed
4. Table state is updated
5. Pagination is synchronized
6. Errors trigger a notification

### **Reload on UI event**

When `reloadTableOn` is configured, the page subscribes to `uiEventSubject` on mount and calls `loadData()`
again every time an event with one of the configured keys is emitted, keeping the current pagination and
active filters. This lets a zone-injected action (e.g. a [`FormDialogButton`](../components/button/FormDialogButton.md)
with `emitOnSubmit`, or a `GenericSortableListCard` with `emitOnSave` or
`emitOnCreate`) refresh the table after it succeeds.
The subscription is released when the page unmounts.

---

## **Pagination**

The component supports full server-side pagination:

- Quasar pagination format (`QuasarPagination`)
- Converted internally using `usePagination`
- Updated on every request event

---

## **Sorting**

Columns marked as `sortable: true` can be sorted by clicking their header.

Each click cycles through: **No sort → Ascending → Descending → No sort**.

---

## **Filtering**

Rendered only when `options.filters` is provided and non-empty.

- Filter definitions (`options.filters`) are passed as the catalog to `LinPulsarSmartFilter`
- Active filters are initialized on mount from the URL via `getFiltersFromUrl` (from `useLinPulsarFilterUrl`), matched against the configured filter definitions
- On `update:filters`:
  1. The active filters are updated
  2. Pagination is reset to page 1
  3. The URL is updated via `setFiltersInUrl`, preserving any keys listed in `keepQueryParams`
  4. `loadData()` is called, sending the active filters as a query filter (built by `toQueryFilter`) to `getEntities`

Each active filter is serialized to a query param using `filter.toString()`, keyed by `filter.name`. See `useLinPulsarFilterUrl` in `@linagora/lin-pulsar-core` for the exact URL format, and [LinPulsarSmartFilter](../components/smart-filter/LinPulsarSmartFilter.md) for the filtering UI and supported filter types.

---

## **Zones**

This page exposes all default generic page zones described in the main **Zones** documentation, plus two
page-specific zones:

| Zone                          | Props                                                               | Description                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `{instanceId}.row-actions`    | `entity`, `row`, `rowKey`, `instanceId`, `uiNamespace`, `i18nScope` | Before the per-row See button                                                                                          |
| `{instanceId}.columns.{name}` | `entity`, `instanceId`, `uiNamespace`, `i18nScope`                  | Replaces the cell content of the column `{name}` (see [GenericEntityTable](../components/table/GenericEntityTable.md)) |

`entity` and `row` both carry the row data — `entity` is provided for consistency with other zones injecting
components that expect an `entity` prop (e.g. `GenericEditableTableCard`).

The `header.actions` zone is rendered inside the actions card, before the create button, and therefore receives a
`uiNamespace` scoped to `.buttons-card` and an `i18nScope` scoped to `.ButtonsCard`.

The actions column itself is always rendered. If `enableSeeButton` is set to `false` and no plugin is configured
for the `row-actions` zone, the column is displayed empty.

The page renders the column zones itself, with the same behavior as the
[`GenericEntityTable`](../components/table/GenericEntityTable.md) column zones: the zone replaces
the cell content of the column, `entity` carries the row, and a `multiItem` column renders the zone
once per item of the array resolved from `itemPath`. In the zones of a `multiItem` column, `entity`
carries the item instead of the row.

### **Example: per-row update button with table reload**

The `row-actions` zone receives the row through its `entity` prop, so a
[`FormDialogButton`](../components/button/FormDialogButton.md) declared there can update it in place with
`fillFormWithEntity` and a `PUT` request addressed by `entity.id`. Pairing its `emitOnSubmit` with a matching
`reloadTableOn` key makes the table reload once the update succeeds:

```json
{
  "instanceId": "moduleApplicationTablePage",
  "remoteName": "LinPulsar",
  "apiEndpoint": "applications",
  "basePath": "/applications",
  "zones": [
    {
      "zone": "moduleApplicationTablePage.row-actions",
      "plugin": "LinPulsar/FormDialogButton",
      "props": {
        "url": "/applications/{{ entity.id }}",
        "method": "PUT",
        "fillFormWithEntity": true,
        "formFields": [
          {
            "name": "name",
            "type": "String",
            "input": "Text",
            "required": true,
            "inputSettings": {}
          }
        ],
        "emitOnSubmit": "applications:updated"
      }
    }
  ],
  "options": {
    "layout": "LinPulsar/BaseLayout",
    "page": "LinPulsar/GenericTablePage",
    "pagePath": "",
    "idKey": "id",
    "enableActions": true,
    "creationPagePath": "/applications/new",
    "reloadTableOn": ["applications:updated"],
    "columns": [
      { "label": "columns.name", "name": "name", "field": "name" },
      { "label": "columns.actions", "name": "table_actions", "field": "" }
    ]
  }
}
```

---

## **Internationalization**

- Scoped by `instanceId`
- Column labels are translated dynamically
- Default keys:
  - `title`
  - `seeButton`
  - `error`
  - `ButtonsCard.create`
  - `DeleteFavoriteDialog.title` — title of the delete-favorite confirmation dialog
  - `DeleteFavoriteDialog.content` — body of the delete-favorite confirmation dialog (`{label}` placeholder available)
  - `OverrideFavoriteDialog.title` — title of the override-favorite form dialog
  - `OverrideFavoriteDialog.content` — body of the override-favorite form dialog
  - `CreateFavoriteDialog.title` — title of the create-favorite form dialog
  - `CreateFavoriteDialog.content` — body of the create-favorite form dialog
  - `RemoveFavoriteNotifyMessage` — notification message displayed when a favorite filter set is successfully deleted
  - `CreateFavoriteNotifyMessage` — notification message displayed when a new favorite filter set is successfully created
  - `OverrideFavoriteNotifyMessage` — notification message displayed when an existing favorite filter set is successfully updated with new filters

---

## **UI Customization**

Uses the `lin-pulsar-core` design system via:

- `useUiDesign()`
- Namespaced UI keys:
  - `{instanceId}.see-button`
  - `{instanceId}.buttons-card.create-button`

---

## **Events**

This component does not emit events directly.

Instead, it relies on:

- router navigation
- external data injection via Module Federation

---

## **Dependencies**

- `GenericEntityTable` (local `LinPulsar` component)
- `ButtonsCard` (local `LinPulsar` component, optional)
- `LinPulsarZoneRenderer` from `@linagora/lin-pulsar-core` (renders the zones)
- `LinPulsar/LinPulsarSmartFilter` (optional)
- `uiEventSubject` from `@linagora/lin-pulsar-core` (used when `reloadTableOn` is configured)
- `@linagora/lin-pulsar-core`
- Quasar Framework

---

## **Summary**

The **GenericTablePage** is a fully generic, federated CRUD-like table page that:

- abstracts data loading and pagination
- standardizes navigation patterns
- supports optional action zones
- supports optional, URL-synced filtering via `LinPulsarSmartFilter`
- integrates tightly with Module Federation architecture

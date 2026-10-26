# **Shared Zone Guidelines 🔌**

This document describes the conventions for **declaring, naming and documenting plugin zones**
in shared components. Zones are injection points rendered by `LinPulsarZoneRenderer` into which any
module can register a federated plugin or a local component.

> See [shared-ui-guidelines.md](./shared-ui-guidelines.md) for general component conventions,
> and [docs/generic-pages.md](./generic-pages.md) for zone usage in
> generic pages.

---

## **🎯 Zone Naming Convention**

All zone names follow a hierarchical pattern based on the component's UI namespace:

```
{uiNamespace}.{component-name}.{location}
```

| Segment            | Source                                                           | Example                |
| ------------------ | ---------------------------------------------------------------- | ---------------------- |
| `{uiNamespace}`    | The component's `uiNamespace` prop, falling back to `instanceId` | `moduleUsers.details`  |
| `{component-name}` | The component's own namespace suffix (kebab-case)                | `entity-profile-panel` |
| `{location}`       | A path describing **where** the zone is rendered                 | `.navigation.prepend`  |

### **Alternate prefix: `instanceId`**

Generic pages expose zones prefixed by `instanceId` (not `uiNamespace`), because pages are hosted
by the module configuration and their zone names must be stable regardless of the hosting namespace:

```
{instanceId}.header.actions
```

---

## **📍 Zone Location Segments**

Use these standard suffixes for the `{location}` segment. A location is a dot-separated path
describing the structural area, then the position:

| Segment         | Meaning                                                   |
| --------------- | --------------------------------------------------------- |
| `header`        | The header area of the page or section                    |
| `content`       | The main content area                                     |
| `footer`        | The bottom area, after the main content                   |
| `actions`       | An area hosting action buttons                            |
| `navigation`    | A navigation bar or toolbar                               |
| `.before`       | Rendered **before** the target element or section         |
| `.after`        | Rendered **after** the target element or section          |
| `.prepend`      | Rendered at the **beginning** of a container (e.g. a bar) |
| `.append`       | Rendered at the **end** of a container (e.g. a bar)       |
| `.prefix`       | Rendered before the main label or title                   |
| `.suffix`       | Rendered after the main label or title                    |
| `.{item}`       | Per-item zone, rendered once per entry in a list or menu  |
| `.{field-name}` | Per-field or per-column zone                              |

---

## **🧩 Declaring Zones in a Component**

### 1. Compute zone names reactively

Zone names must be **reactive** (`computed`) so they update when `uiNamespace` changes:

```ts
const localUiNamespace = computed(() => {
  const prefix = props.uiNamespace || props.instanceId;
  return prefix ? `${prefix}.entity-profile-panel` : 'entity-profile-panel';
});

const zoneNames = computed(() => ({
  prependActions: `${localUiNamespace.value}.actions.prepend`,
  appendActions: `${localUiNamespace.value}.actions.append`,
}));
```

### 2. Render zones with `LinPulsarZoneRenderer`

```vue
<LinPulsarZoneRenderer :zone="zoneNames.prependActions" :entity="entity" :instance-id="instanceId" :ui-namespace="uiNamespace" :i18n-scope="i18nScope" />
```

### 3. Forward relevant props

Every zone should receive the same base props so registered plugins and components have the
context they need:

| Prop          | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `entity`      | The entity the component is rendering (the row, the profile, …) |
| `instanceId`  | The module instance identifier                                  |
| `uiNamespace` | The base UI design namespace, propagated to children            |
| `i18nScope`   | The base i18n scope, propagated to children                     |

Additional component-specific props (e.g. `isLoading`, `row`, `index`, `parentPath`) should be
forwarded to zones that need them. **Document them** in the component's zone table.

### 4. Document zones in the component's Markdown file

Every component that exposes zones must include a **Plugin Zones** section listing:

- The zone name pattern
- Its location in the layout
- The forwarded props
- A typical use-case

Example table (from [EntityProfilePanel](../docs/components/panel/EntityProfilePanel.md)):

| Zone name                                                | Rendered in    | Position               |
| -------------------------------------------------------- | -------------- | ---------------------- |
| `${uiNamespace}.entity-profile-panel.navigation.prepend` | Navigation bar | Before the back button |
| `${uiNamespace}.entity-profile-panel.navigation.append`  | Navigation bar | After the back button  |
| `${uiNamespace}.entity-profile-panel.actions.prepend`    | Actions bar    | Before the edit button |
| `${uiNamespace}.entity-profile-panel.actions.append`     | Actions bar    | After the edit button  |
| `${uiNamespace}.entity-profile-panel.footer`             | Panel body     | At the very bottom     |

---

## **📝 Registering in a Zone**

Zones are registered by consuming modules, **not** by the component that exposes them.

### Via the host configuration file (JSON)

Declarative, for federated plugins:

```json
{
  "zones": [
    {
      "zone": "moduleUserDetailsPage.header.actions",
      "plugin": "myModule/ExportButton",
      "props": { "format": "csv" }
    },
    {
      "zone": "moduleUserDetailsPage.header.actions",
      "component": "myLocalComponent",
      "props": {}
    }
  ]
}
```

### Programmatically via a lifecycle hook

For local components or dynamic registration:

```ts
import { useLinPulsarZoneStore, registerLocalComponent } from '@linagora/lin-pulsar-core';
import MyComponent from './MyComponent.vue';

export function postInit(config: ModuleHostConfig<unknown>) {
  const store = useLinPulsarZoneStore();
  const zone = `${config.instanceId}.header.actions`;

  store.registerPluginOnce(zone, 'myModule/ExportButton');

  registerLocalComponent('MyComponent', MyComponent);
  store.registerComponent(zone, 'MyComponent', { instanceId: config.instanceId });
}
```

- `registerPluginOnce` prevents duplicate registrations — safe to call on every init.
- `registerComponent` has **no** dedup variant — calling it twice renders the component twice.

---

## **✅ Best Practices**

| Rule                                                              | Reason                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Use `uiNamespace`, not hard-coded strings                         | Zones remap automatically when the parent namespace changes                    |
| Use `computed` for zone names                                     | Keeps zones reactive to prop updates                                           |
| Always forward `entity`, `instanceId`, `uiNamespace`, `i18nScope` | Every registered component needs the entity context and scoping                |
| Document every zone in the component's `.md` file                 | Consumers need to know what zones exist and what props they receive            |
| Keep the `{location}` segment flat and descriptive                | `header.actions` is clearer than `zone1`                                       |
| Prefer `registerPluginOnce` over `registerPlugin`                 | Avoids duplicates without tracking state                                       |
| Separate position and content zones                               | `.actions.prepend` ≠ `.actions.append` — both may be used by different plugins |
| Use `i18nScope` not `instanceId` for dedicated dialog scopes      | Avoids key collisions when the same `instanceId` opens multiple dialogs        |

---

## **📚 Reference Implementations**

| Component                                                 | Zones documented                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Generic pages (creation, details, edition, table, import) | [generic-pages.md](./generic-pages.md)                                       |
| `EntityProfilePanel`                                      | [EntityProfilePanel.md](./components/panel/EntityProfilePanel.md)            |
| `GenericSortableListCard`                                 | [GenericSortableListCard.md](./components/card/GenericSortableListCard.md)   |
| `GenericEditableTableCard`                                | [GenericEditableTableCard.md](./components/card/GenericEditableTableCard.md) |
| `GenericTreeCard`                                         | [GenericTreeCard.md](./components/card/GenericTreeCard.md)                   |
| `MenuButton`                                              | [MenuButton.md](./components/button/MenuButton.md)                           |
| `GenericEntityTable`                                      | [GenericEntityTable.md](./components/table/GenericEntityTable.md)            |

---

## **🧠 Design Decisions**

- **Zones are declared by components, consumed by modules.** A component only exposes the injection point;
  it never registers anything into its own zones. The host module or the application configuration
  decides what to render there.
- **Zone names are opaque to the renderer.** `LinPulsarZoneRenderer` does not interpret the name;
  it simply queries the zone store. As long as the consumer registers under the same string,
  any name is valid.
- **Nesting is supported.** A zone rendered inside a component hosted by another zone inherits the
  parent's namespace, keeping the naming chain consistent.

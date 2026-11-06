# **LifecycleButtonsCard 🔄**

The **LifecycleButtonsCard** component groups the lifecycle dropdowns of an entity (activation, suspension and
deactivation) into one card, rendering one `DropdownButton` per lifecycle type. The displayed buttons, their order and
their disabled state are driven by configuration, and the host provides the menu items available for the entity
status. The card runs no action: it emits the clicked item, which the [LifecyclePanel](../panel/LifecyclePanel.md)
runs with its configured dialog and request.

---

## **🎯 Purpose**

- Renders one dropdown per lifecycle type (`activation`, `suspension`, `deactivation`)
- Orders, hides and disables the dropdowns from a configuration array
- Hides a dropdown when the host provides no menu item for its type
- Emits the clicked menu item
- Exposes `prepend` and `append` zones around the dropdowns

---

## **⚙️ Props**

| Prop name     | Type                                               | Default                                                                      | Description                                                                                       |
| ------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `items`       | `Partial<Record<LifecycleButtonType, MenuItem[]>>` | —                                                                            | Menu items of each dropdown, indexed by lifecycle type. A dropdown without items is not displayed |
| `buttons`     | `LifecycleButton[]`                                | `[{ type: 'activation' }, { type: 'suspension' }, { type: 'deactivation' }]` | Dropdowns in display order. Only the first configuration of each type is kept                     |
| `entity`      | `Record<string, unknown>`                          | `{}`                                                                         | Entity provided to the `disable` templates, and forwarded to the zones                            |
| `instanceId`  | `String`                                           | `undefined`                                                                  | Instance identifier forwarded to the zones                                                        |
| `uiNamespace` | `String`                                           | —                                                                            | Base UI namespace used for design system customization                                            |
| `i18nScope`   | `String`                                           | —                                                                            | Identifier used to scope translations                                                             |

### LifecycleButton

| Property  | Type                                             | Default | Description                                                                                                                           |
| --------- | ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | `'activation' \| 'suspension' \| 'deactivation'` | —       | Lifecycle type of the dropdown                                                                                                        |
| `disable` | `Boolean \| String`                              | `false` | Whether the dropdown is disabled: a boolean, or a Nunjucks template rendered with `entity` that disables it when it renders to `true` |

A type missing from `buttons` is not displayed: listing the types to display is enough to hide the others.

---

## **📤 Events**

| Event       | Payload                | Description                                                   |
| ----------- | ---------------------- | ------------------------------------------------------------- |
| `itemClick` | `DropdownClickPayload` | Emitted with the key of the menu item clicked in any dropdown |

---

## **🧩 Zones**

| Zone                                            | Description                        |
| ----------------------------------------------- | ---------------------------------- |
| `[UI_NAMESPACE].lifecycle-buttons-card.prepend` | Rendered before the first dropdown |
| `[UI_NAMESPACE].lifecycle-buttons-card.append`  | Rendered after the last dropdown   |

Both zones receive the `entity` (an empty object when not provided), the `instanceId`, the
`[UI_NAMESPACE].lifecycle-buttons-card` UI namespace and the `[I18N_SCOPE].LifecycleButtonsCard` i18n scope.

---

## **🧩 Internal Behavior**

- A dropdown is displayed when its type is configured in `buttons` and the host provides at least one menu item for
  it. Updating `items` adds or removes the dropdowns accordingly.
- A type missing from `buttons` is not displayed, even when `items` holds menu items for it.
- When a type is configured several times, only its first configuration is kept.
- A `disable` template is rendered with `entity`, so that a dropdown can follow the entity status, for example
  `"{{ entity.status == 'SUSPENDED' }}"`.
- The card is not rendered when no dropdown is displayed and no component is registered in its zones.
- Clicking a menu item emits `itemClick` with its key.

---

## **🌍 Internationalization**

All keys live under `[I18N_SCOPE].LifecycleButtonsCard`:

| Key                                | Description                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `ButtonsCard.title`                | Card title (hidden when the key does not exist)                                   |
| `[TYPE].DropdownButton.title`      | Label of the `[TYPE]` dropdown                                                    |
| `[TYPE].DropdownButton.[ITEM_KEY]` | Label of a menu item of the `[TYPE]` dropdown, for example `activation.immediate` |

See [`DropdownButton.md`](../button/DropdownButton.md) for the menu item keys. Inside a
[LifecyclePanel](../panel/LifecyclePanel.md#-internationalization), `[I18N_SCOPE]` is the i18n scope of the panel,
whose default labels are shipped by `LinPulsar/DetailsPageI18n`.

---

## **🎨 UI Design**

The namespace is `[UI_NAMESPACE].lifecycle-buttons-card`. See the
[design documentation](../../design.md#lifecyclebuttonscard).

---

## **🧩 Usage Examples**

### Buttons configuration

For example, a card displaying the suspension first, the deactivation disabled while the account is suspended, and
no activation:

```json
{
  "buttons": [{ "type": "suspension" }, { "type": "deactivation", "disable": "{{ entity.status == 'SUSPENDED' }}" }]
}
```

With menu items provided for the three types, the card renders, from left to right:

| Position | Dropdown     | State                                   |
| -------- | ------------ | --------------------------------------- |
| 1        | Suspension   | Enabled                                 |
| 2        | Deactivation | Disabled while the account is suspended |
| -        | Activation   | Hidden, as it is not configured         |

Without `buttons`, the three dropdowns are rendered in the default order, all enabled: activation, suspension, then
deactivation. A dropdown without menu items is hidden whatever its configuration.

### Usage in a component

The host computes the menu items and runs the clicked item:

```vue
<script setup lang="ts">
import { loadAsyncComponent } from '@linagora/lin-pulsar-core';

const lifecycleButtonsCard = loadAsyncComponent('LinPulsar/LifecycleButtonsCard');

const items = {
  activation: [{ key: 'activation.immediate', clickable: true }],
  suspension: [{ key: 'suspension.scheduled', clickable: true }],
};

/**
 * Runs the clicked lifecycle action.
 * @param payload - The clicked menu item.
 */
function onItemClick(payload: { key: string }): void {
  // Open the dialog of the action.
}
</script>

<template>
  <component
    :is="lifecycleButtonsCard"
    v-if="lifecycleButtonsCard"
    ui-namespace="moduleAccountDetailsPage"
    i18n-scope="moduleAccountDetailsPage"
    :items="items"
    @item-click="onItemClick"
  />
</template>
```

The [LifecyclePanel](../panel/LifecyclePanel.md) computes the items from the entity status and runs the actions from
configuration only.

### Zone configuration

```json
{
  "zone": "moduleAccountDetailsPage.lifecycle-panel.lifecycle-buttons-card.append",
  "plugin": "LinPulsar/RedirectButton",
  "props": { "to": "/accounts/{{ entity.id }}/history" }
}
```

---

## **🧪 Testing**

| Element                  | `data-cy`                       |
| ------------------------ | ------------------------------- |
| Card                     | `lifecycle-buttons-card`        |
| Dropdown of the `[TYPE]` | `lifecycle-buttons-card_[TYPE]` |

The menu items keep the `dropdown-button_item_[ITEM_KEY]` attribute of the `DropdownButton`.

---

## **🎨 CSS Classes**

- `.lifecycle-buttons-card` - Main card container
- `.lifecycle-buttons-card--[TYPE]` - Dropdown of the `[TYPE]` lifecycle type

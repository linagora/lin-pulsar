# **LifecycleButtonsCard 🔄**

The **LifecycleButtonsCard** component groups the lifecycle actions of an entity (activation, suspension and
deactivation) into one card, rendering one `DropdownButton` per lifecycle type. The displayed buttons, their order
and their disabled state are driven by configuration. Each menu item runs a configured action: a
confirmation or form dialog is opened, then a request is sent to the API, the user is notified and the hosting page is
told to reload the entity. The hosting component only provides the menu items available for the entity status.

---

## **🎯 Purpose**

- Renders one dropdown per lifecycle type (`activation`, `suspension`, `deactivation`)
- Orders, hides and disables the dropdowns from a configuration array
- Hides a dropdown when the host provides no menu item for its type
- Runs the action configured for the clicked menu item: dialog, request, notification and reload event
- Runs the same actions on request of other components, such as banners, through a UI event
- Exposes `prepend` and `append` zones around the dropdowns

---

## **⚙️ Props**

| Prop name              | Type                                               | Default                                                                      | Description                                                                                                                                                      |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`                | `Partial<Record<LifecycleButtonType, MenuItem[]>>` | —                                                                            | Menu items of each dropdown, indexed by lifecycle type. A dropdown without items is not displayed                                                                |
| `buttons`              | `LifecycleButton[]`                                | `[{ type: 'activation' }, { type: 'suspension' }, { type: 'deactivation' }]` | Dropdowns in display order. Only the first configuration of each type is kept                                                                                    |
| `actions`              | `Record<string, LifecycleAction>`                  | `{}`                                                                         | Actions run by the menu items, indexed by menu item key, for example `suspension.immediate`. A menu item without action only emits `itemClick`                   |
| `emitOnSubmit`         | `String`                                           | `undefined`                                                                  | Event key published on `uiEventSubject` after a successful action, with the response body as data, for example to reload the entity through `reloadDetailsOn`    |
| `triggerActionOn`      | `String`                                           | `undefined`                                                                  | Event key on which the card runs the action whose key is the `key` of the event data, so that other components can run the configured actions                    |
| `immediateActionDelay` | `Number`                                           | `5`                                                                          | Delay in minutes between the submission of an action and `immediateDate`, the start date of the immediate actions, also provided as `count` to the notifications |
| `entity`               | `Record<string, unknown>`                          | `{}`                                                                         | Entity targeted by the actions, provided to their templates and translations and to the `disable` templates, and forwarded to the zones                          |
| `instanceId`           | `String`                                           | `undefined`                                                                  | Instance identifier passed to the form dialog fields (e.g. API validation rules) and forwarded to the zones                                                      |
| `uiNamespace`          | `String`                                           | —                                                                            | Base UI namespace used for design system customization                                                                                                           |
| `i18nScope`            | `String`                                           | —                                                                            | Identifier used to scope translations                                                                                                                            |

### LifecycleButton

| Property  | Type                                             | Default | Description                                                                                                                           |
| --------- | ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | `'activation' \| 'suspension' \| 'deactivation'` | —       | Lifecycle type of the dropdown                                                                                                        |
| `disable` | `Boolean \| String`                              | `false` | Whether the dropdown is disabled: a boolean, or a Nunjucks template rendered with `entity` that disables it when it renders to `true` |

A type missing from `buttons` is not displayed: listing the types to display is enough to hide the others.

### LifecycleAction

| Property             | Type                                | Default  | Description                                                                                                                      |
| -------------------- | ----------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `dialog`             | `'confirmation' \| 'form'`          | —        | Dialog opened before sending the request: a confirmation dialog, or a form dialog collecting the `formFields`                    |
| `url`                | `String`                            | —        | Request URL, as a Nunjucks template rendered with `entity`, the entity merged with the submitted form data, and `immediateDate`  |
| `method`             | `'DELETE' \| 'POST' \| 'PUT'`       | `'POST'` | HTTP method of the request                                                                                                       |
| `body`               | `Record<string, unknown>`           | `{}`     | JSON body of the request, every nested string being a Nunjucks template rendered like `url`. Not sent when empty                 |
| `formFields`         | `LinPulsarAttributeConfiguration[]` | `[]`     | Fields of the form dialog (see [FormDialog](../dialog/FormDialog.md)). Ignored by the confirmation dialog                        |
| `fillFormWithEntity` | `Boolean`                           | `false`  | Whether the form dialog is pre-filled with the entity values, for example to modify a period. Ignored by the confirmation dialog |

---

## **📤 Events**

| Event       | Payload                | Description                                                                                      |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `itemClick` | `DropdownClickPayload` | Emitted with the key of the menu item clicked in any dropdown, before its action, if any, is run |

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

### Dropdowns

- A dropdown is displayed when its type is configured in `buttons` and the host provides at least one menu item for
  it. Updating `items` adds or removes the dropdowns accordingly.
- A type missing from `buttons` is not displayed, even when `items` holds menu items for it.
- When a type is configured several times, only its first configuration is kept.
- A `disable` template is rendered with `entity`, so that a dropdown can follow the entity status, for example
  `"{{ entity.status == 'SUSPENDED' }}"`.
- The card is not rendered when no dropdown is displayed and no component is registered in its zones.

### Actions

- Clicking a menu item emits `itemClick`, then runs the action configured for its key in `actions`. A menu item
  without action only emits `itemClick`, so that the host can handle it.
- A `form` action opens the shared form dialog with its `formFields`, pre-filled with a deep copy of the entity when
  `fillFormWithEntity` is enabled: fields with a nested name, such as `suspensionPeriod.end`, are pre-filled from the
  nested entity properties, and editing them never changes the entity of the page. A `confirmation` action opens the
  shared confirmation dialog.
- Once the dialog is confirmed, the request is sent with the `url` and `body` rendered with `entity`, the entity merged
  with the submitted form data, and `immediateDate`, the ISO date `immediateActionDelay` minutes after the submission.
  The body is not sent when it is empty.
- The top-level properties of the form data replace those of the entity: a form field named `suspensionPeriod.end`
  replaces the whole `suspensionPeriod` of the entity, so that a scheduled period never inherits the bounds of the
  current one. To edit a single bound of the current period, enable `fillFormWithEntity`: the form then holds the
  whole period.
- `immediateDate` is the start date of the immediate actions, such as an immediate suspension: the API refuses a start
  date in the past, so the date is computed on submission, not when the dialog opens, and pushed `immediateActionDelay`
  minutes later.
- On success, the user is notified and `emitOnSubmit` is published with the response body, typically listed in the
  `reloadDetailsOn` option of the details page, which reloads the entity: the host then computes the new menu items.
- On failure, whether a template cannot be rendered or the request fails, the user is notified. The form dialog stays
  open for correction, while the confirmation dialog closes.
- When `triggerActionOn` is set, the events published with this key on `uiEventSubject` run the action whose key is
  the `key` of their data, with the same dialog, request and notifications as a click on a menu item. This lets other
  components, such as the banners of a details page, run the configured actions without opening their own dialogs.
- The dropdowns are not involved in the actions run by events: such an action runs even when its menu item is not
  displayed or its dropdown is disabled, since the banners usually offer actions that are not in the dropdowns. Events
  without a configured action are ignored.

---

## **🌍 Internationalization**

All keys live under `[I18N_SCOPE].LifecycleButtonsCard`, `[ACTION_KEY]` being the key of the action, for example
`suspension.immediate`, and `[DIALOG]` being `FormDialog` or `ConfirmationDialog` depending on the `dialog` of the
action:

| Key                                         | Description                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `ButtonsCard.title`                         | Card title (hidden when the key does not exist)                                    |
| `[TYPE].DropdownButton.title`               | Label of the `[TYPE]` dropdown                                                     |
| `[TYPE].DropdownButton.[ITEM_KEY]`          | Label of a menu item of the `[TYPE]` dropdown, for example `activation.immediate`  |
| `actions.[ACTION_KEY].[DIALOG].title`       | Title of the dialog of the action                                                  |
| `actions.[ACTION_KEY].[DIALOG].content`     | Content of the dialog of the action (optional)                                     |
| `actions.[ACTION_KEY].[DIALOG].ButtonsCard` | Labels of the dialog buttons (see [ButtonsCard](./ButtonsCard.md))                 |
| `actions.[ACTION_KEY].FormDialog.fields`    | Labels and messages of the form fields (see [FormDialog](../dialog/FormDialog.md)) |
| `actions.[ACTION_KEY].submitSuccess`        | Success notification of the action, falling back to `submitSuccess`                |
| `actions.[ACTION_KEY].submitError`          | Error notification of the action, falling back to `submitError`                    |
| `submitSuccess`                             | Default success notification of the actions                                        |
| `submitError`                               | Default error notification of the actions                                          |

The dialog title and content receive the entity properties as named parameters, and the notifications the entity
properties merged with the submitted form data, for example `"Account {id} suspended"`, plus `immediateActionDelay` as
`count`, which also selects the plural form, for example `"Suspended in one minute | Suspended in {count} minutes"`.

Default `fr-FR` and `en-US` labels are shipped by the federated remote `LinPulsar/ImportPageI18n`, under the
`{{ config.instanceId }}.LifecycleButtonsCard` key: the default notifications, the three dropdown titles, the
`activation.immediate`, `activation.scheduled`, `suspension.immediate`, `suspension.scheduled`, `suspension.modify`,
`deactivation.immediate`, `deactivation.scheduled` and `deactivation.modify` items, and the title and button labels of
their dialogs, `activation.immediate` being a confirmation dialog and the others form dialogs. The form fields depend
on the host and have no default labels.

These defaults only apply when the `i18nScope` of the card is the `instanceId` of a module whose `i18nRemote` is
`LinPulsar/ImportPageI18n`, since the remote namespaces them under that `instanceId`. In any other case, the host
provides the labels in its own translations.

See [`DropdownButton.md`](../button/DropdownButton.md) for the menu item keys.

---

## **🎨 UI Design**

The namespace is `[UI_NAMESPACE].lifecycle-buttons-card`. The dialogs of the actions use the
`[UI_NAMESPACE].lifecycle-buttons-card.form-dialog` and `[UI_NAMESPACE].lifecycle-buttons-card.confirmation-dialog`
namespaces. See the [design documentation](../../design.md#lifecyclebuttonscard).

---

## **🧩 Usage Examples**

### Buttons configuration

The `buttons` array is plain JSON: the host component usually receives it through the `props` of its own zone entry
and forwards it to the card unchanged. For example, an `AccountLifecyclePanel` host rendered in the
`content.before` zone of a details page, displaying the suspension first, the deactivation disabled while the
account is suspended, and no activation:

```json
{
  "zone": "moduleAccountDetailsPage.content.before",
  "component": "AccountLifecyclePanel",
  "props": {
    "buttons": [{ "type": "suspension" }, { "type": "deactivation", "disable": "{{ entity.status == 'SUSPENDED' }}" }]
  }
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

### Actions configuration

Each menu item key is mapped to its dialog and request. For example, a scheduled suspension collecting a reason and a
start date, a modification of the suspension pre-filled with the entity, and an immediate activation confirmed without
form, starting one hour after the confirmation:

```json
{
  "actions": {
    "suspension.scheduled": {
      "dialog": "form",
      "url": "/accounts/{{ entity.id }}/status/suspend",
      "method": "PUT",
      "formFields": [
        { "name": "reason", "type": "String", "input": "Text", "required": true },
        { "name": "start", "type": "Date", "input": "Date", "required": true }
      ],
      "body": {
        "suspensionPeriod": { "start": "{{ entity.start }}" },
        "reason": "{{ entity.reason }}"
      }
    },
    "suspension.modify": {
      "dialog": "form",
      "url": "/accounts/{{ entity.id }}/status/suspend",
      "method": "PUT",
      "fillFormWithEntity": true,
      "formFields": [{ "name": "reason", "type": "String", "input": "Text", "required": true }],
      "body": { "reason": "{{ entity.reason }}" }
    },
    "activation.immediate": {
      "dialog": "confirmation",
      "url": "/accounts/{{ entity.id }}/status/schedule-activation",
      "method": "PUT",
      "body": { "validityStart": "{{ immediateDate }}" }
    }
  },
  "immediateActionDelay": 60,
  "emitOnSubmit": "account-status-updated"
}
```

With `"reloadDetailsOn": ["account-status-updated"]` on the details page, the entity is reloaded after each action, and
the host computes the new menu items from its new status.

### Usage through Module Federation

The host computes the menu items from the entity status and forwards the configuration:

```vue
<script setup lang="ts">
import { loadAsyncComponent } from '@linagora/lin-pulsar-core';

const props = defineProps<{
  entity: Record<string, unknown>;
  uiNamespace: string;
  buttons?: Record<string, unknown>[];
  actions?: Record<string, Record<string, unknown>>;
}>();

const lifecycleButtonsCard = loadAsyncComponent('LinPulsar/LifecycleButtonsCard');

const items = {
  activation: [{ key: 'activation.immediate', clickable: true }],
  suspension: [
    { key: 'suspension.scheduled', clickable: true },
    { key: 'suspension.modify', clickable: true },
  ],
};
</script>

<template>
  <component
    :is="lifecycleButtonsCard"
    v-if="lifecycleButtonsCard"
    :ui-namespace="props.uiNamespace"
    i18n-scope="AccountLifecyclePanel"
    :entity="props.entity"
    :items="items"
    :buttons="props.buttons"
    :actions="props.actions"
    emit-on-submit="account-status-updated"
    trigger-action-on="account-lifecycle-action"
  />
</template>
```

Passing `undefined` as `buttons` keeps the default order.

### Running an action from another component

With `trigger-action-on="account-lifecycle-action"`, a banner of the same page runs the configured modification of
the suspension, with its dialog, request and notifications:

```ts
uiEventSubject.next({ key: 'account-lifecycle-action', data: { key: 'suspension.modify' } });
```

### Zone configuration

```json
{
  "zone": "moduleAccountDetailsPage.lifecycle-buttons-card.append",
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

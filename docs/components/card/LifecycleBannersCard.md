# **LifecycleBannersCard 🚩**

The **LifecycleBannersCard** component stacks the lifecycle banners of an entity, such as "suspended since" or
"deactivated in 3 days", in one card. It is a presentational card: it translates the content of each banner with the
values it receives, renders one button per action and emits the clicked action. Its host selects the banners matching
the entity status, computes their values and runs the clicked actions.

---

## **🎯 Purpose**

- Renders one `QBanner` per banner, in the given order
- Translates the content of each banner with its named parameters
- Renders one button per action of a banner, emitting the action key on click

---

## **⚙️ Props**

| Prop name     | Type                | Default | Description                                            |
| ------------- | ------------------- | ------- | ------------------------------------------------------ |
| `banners`     | `LifecycleBanner[]` | —       | Banners to display, in display order                   |
| `uiNamespace` | `String`            | —       | Base UI namespace used for design system customization |
| `i18nScope`   | `String`            | —       | Identifier used to scope translations                  |

### LifecycleBanner

| Property  | Type                      | Default     | Description                                                                                                        |
| --------- | ------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `key`     | `String`                  | —           | Key of the banner, selecting its translations, design namespace, CSS class and `data-cy`. Unique among the banners |
| `actions` | `String[]`                | `[]`        | Keys of the actions offered by the banner buttons, in display order, for example `suspension.modify`               |
| `params`  | `Record<string, unknown>` | `{}`        | Named parameters of the content translation, for example a formatted `date`                                        |
| `content` | `String`                  | `'content'` | Translation key of the content, relative to the banner key, for example `contentWithEndDate`                       |

---

## **📤 Events**

| Event         | Payload                        | Description                                                 |
| ------------- | ------------------------------ | ----------------------------------------------------------- |
| `actionClick` | `LifecycleBannerActionPayload` | Emitted with the action key of the clicked button, as `key` |

---

## **🧩 Internal Behavior**

- The card is not rendered when `banners` is empty, and follows the updates of `banners`.
- The parameters keep their type: a numeric `count` selects the plural form of the content, for example
  `"Deactivated today | Deactivated tomorrow | Deactivated in {count} days"` for a `count` of 0, 1, or more. A missing
  `count` still selects a form, here the second one, so a banner using `count` must always receive it.
- Clicking a button emits `actionClick` with the action key. The card runs no action by itself.

---

## **🌍 Internationalization**

All keys live under `[I18N_SCOPE].LifecycleBannersCard`, `[KEY]` being the key of the banner and `[ACTION_KEY]` the key
of one of its actions:

| Key                          | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `[KEY].content`              | Content of the banner, receiving its `params` as named parameters |
| `[KEY].[CONTENT]`            | Content selected by the `content` of the banner, same parameters  |
| `[KEY].actions.[ACTION_KEY]` | Label of the button of the action                                 |

The keys are defined by the host, so the card ships no default label.

---

## **🎨 UI Design**

The namespace is `[UI_NAMESPACE].lifecycle-banners-card`, used by the `q-card`, each banner using the `[KEY]`
sub-namespace for its `q-banner` and `q-icon`, and `[KEY].actions.[ACTION_KEY]` for the `q-btn` of each action. The
icon is only rendered when the design defines its `name`, and the colors of a banner are set through the `class` of its
`q-banner`. See the [design documentation](../../design.md#lifecyclebannerscard).

---

## **🧩 Usage Examples**

The host computes the values of the banners and runs the clicked actions, for example a suspension with an end date and
a deactivation warning:

```vue
<script setup lang="ts">
import { loadAsyncComponent } from '@linagora/lin-pulsar-core';

const lifecycleBannersCard = loadAsyncComponent('LinPulsar/LifecycleBannersCard');

const banners = [
  {
    key: 'suspended',
    actions: ['reactivation.immediate', 'suspension.modify'],
    params: { date: '01/04/2026', endDate: '01/08/2026' },
    content: 'contentWithEndDate',
  },
  { key: 'deactivationWarning', actions: ['deactivation.modify'], params: { date: '12/05/2026', count: 8 } },
];

/**
 * Runs the clicked lifecycle action.
 * @param payload - The clicked action.
 */
function onActionClick(payload: { key: string }): void {
  // Open the dialog of the action.
}
</script>

<template>
  <component
    :is="lifecycleBannersCard"
    v-if="lifecycleBannersCard"
    ui-namespace="moduleAccountDetailsPage"
    i18n-scope="moduleAccountDetailsPage"
    :banners="banners"
    @action-click="onActionClick"
  />
</template>
```

With the translations:

```json
{
  "LifecycleBannersCard": {
    "suspended": {
      "content": "Suspended since {date}.",
      "contentWithEndDate": "Suspended from {date} until {endDate}.",
      "actions": {
        "reactivation": { "immediate": "Immediate reactivation" },
        "suspension": { "modify": "Modify the suspension" }
      }
    },
    "deactivationWarning": {
      "content": "Deactivated today (on {date}). | Deactivated tomorrow (on {date}). | Deactivated in {count} days (on {date}).",
      "actions": { "deactivation": { "modify": "Modify the deactivation date" } }
    }
  }
}
```

---

## **🧪 Testing**

| Element                          | `data-cy`                                   |
| -------------------------------- | ------------------------------------------- |
| Card                             | `lifecycle-banners-card`                    |
| Banner `[KEY]`                   | `lifecycle-banners-card_[KEY]`              |
| Button of the action of a banner | `lifecycle-banners-card_[KEY]_[ACTION_KEY]` |

---

## **🎨 CSS Classes**

- `.lifecycle-banners-card` - Main card container
- `.lifecycle-banners-card--[KEY]` - Banner `[KEY]`

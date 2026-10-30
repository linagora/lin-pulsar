# **LifecycleBannersCard 🚩**

The **LifecycleBannersCard** component renders the lifecycle banners of an entity, such as "suspended since" or
"deactivated in 3 days", in one card. Each banner displays a translated content filled with formatted entity fields,
and buttons publishing the key of their action, typically run by a
[LifecycleButtonsCard](./LifecycleButtonsCard.md) through its `triggerActionOn` option. The hosting component only
selects the banners to display for the entity status.

---

## **🎯 Purpose**

- Renders one `QBanner` per configured banner, in configuration order
- Fills the content of each banner with entity fields, optionally formatted, for example as dates
- Selects the content translation from the entity, for example whether a suspension has an end date
- Renders one button per action of a banner, publishing the action key on click

---

## **⚙️ Props**

| Prop name     | Type                      | Default     | Description                                                                                                                              |
| ------------- | ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `banners`     | `LifecycleBanner[]`       | —           | Banners to display, in display order, usually selected by the host from the entity status. Only the first configuration of a key is kept |
| `entity`      | `Record<string, unknown>` | `{}`        | Entity whose fields fill the banner contents, also provided to the `content` templates                                                   |
| `emitOnClick` | `String`                  | `undefined` | Event key published on `uiEventSubject` when a banner button is clicked, with the action key as `key` of its data                        |
| `uiNamespace` | `String`                  | —           | Base UI namespace used for design system customization                                                                                   |
| `i18nScope`   | `String`                  | —           | Identifier used to scope translations                                                                                                    |

### LifecycleBanner

| Property  | Type                             | Default     | Description                                                                                                       |
| --------- | -------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `key`     | `String`                         | —           | Key of the banner, selecting its translations, design namespace, CSS class and `data-cy`, for example `suspended` |
| `actions` | `String[]`                       | `[]`        | Keys of the actions offered by the banner buttons, in display order, for example `suspension.modify`              |
| `params`  | `Record<String, FieldFormatter>` | `{}`        | Named parameters of the content translation, each read from an entity field and optionally formatted              |
| `content` | `String`                         | `'content'` | Translation key of the content, relative to the banner key, as a Nunjucks template rendered with `entity`         |

Each parameter of `params` is a `FieldFormatter`: the `field` path of the entity, nested paths such as
`suspensionPeriod.start` included, and an optional `formatter` with its `formatOptions` (see
[Value formatting](../../value-formatting.md)).

---

## **📤 Events**

| Event         | Payload                | Description                                       |
| ------------- | ---------------------- | ------------------------------------------------- |
| `actionClick` | `DropdownClickPayload` | Emitted with the action key of the clicked button |

---

## **🧩 Internal Behavior**

- The card is not rendered when `banners` is empty.
- When a key is configured several times, only its first configuration is kept, and an action listed several times in
  a banner is displayed once.
- The content translation receives the `params` as named parameters. A field missing from the entity renders as an
  empty string. The values keep their type, so that a numeric `count` selects the plural form, for example
  `"Deactivated tomorrow | Deactivated in {count} days"`.
- The `content` template selects the translation key of the content, for example
  `"{{ 'contentWithEndDate' if entity.suspensionPeriod.end else 'content' }}"` displays the end of a suspension only
  when it is set.
- Clicking a button emits `actionClick`, then publishes `emitOnClick`, if set, with the action key: a
  `LifecycleButtonsCard` whose `triggerActionOn` is the same key runs the action, with its dialog, request and
  notifications. The card runs no action by itself.
- The contents and buttons follow the updates of `banners` and `entity`, for example when the details page reloads the
  entity after an action.

---

## **🌍 Internationalization**

All keys live under `[I18N_SCOPE].LifecycleBannersCard`, `[KEY]` being the key of the banner and `[ACTION_KEY]` the key
of one of its actions:

| Key                          | Description                                                               |
| ---------------------------- | ------------------------------------------------------------------------- |
| `[KEY].content`              | Content of the banner, receiving its `params` as named parameters         |
| `[KEY].[CONTENT]`            | Content selected by the `content` template of the banner, same parameters |
| `[KEY].actions.[ACTION_KEY]` | Label of the button of the action                                         |

The keys are defined by the configuration, so no default label is shipped.

---

## **🎨 UI Design**

The namespace is `[UI_NAMESPACE].lifecycle-banners-card`, each banner using the `[KEY]` sub-namespace for its
`q-banner` and `q-icon`, and `[KEY].actions.[ACTION_KEY]` for the `q-btn` of each action. The icon is only rendered
when the design defines its `name`. See the [design documentation](../../design.md#lifecyclebannerscard).

---

## **🧩 Usage Examples**

### Banners configuration

The banners are plain JSON: the host component usually receives them through the `props` of its own zone entry. For
example, a suspension banner displaying its start and end dates, offering an immediate reactivation and the
modification of the suspension, and a deactivation warning displaying the remaining days:

```json
{
  "banners": [
    {
      "key": "suspended",
      "actions": ["reactivation.immediate", "suspension.modify"],
      "content": "{{ 'contentWithEndDate' if entity.suspensionPeriod.end else 'content' }}",
      "params": {
        "date": {
          "field": "suspensionPeriod.start",
          "formatter": "toDate",
          "formatOptions": { "formatKey": "application.dateFormat" }
        },
        "endDate": {
          "field": "suspensionPeriod.end",
          "formatter": "toDate",
          "formatOptions": { "formatKey": "application.dateFormat" }
        }
      }
    },
    {
      "key": "deactivation-warning",
      "actions": ["deactivation.immediate", "deactivation.modify"],
      "params": {
        "count": { "field": "daysBeforeDeactivation" }
      }
    }
  ]
}
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
    "deactivation-warning": {
      "content": "Deactivated tomorrow | Deactivated in {count} days",
      "actions": {
        "deactivation": { "immediate": "Immediate deactivation", "modify": "Modify the deactivation date" }
      }
    }
  }
}
```

### Usage through Module Federation

The host selects the banners matching the entity status, and runs their actions through its `LifecycleButtonsCard`:

```vue
<script setup lang="ts">
import { loadAsyncComponent } from '@linagora/lin-pulsar-core';
import { computed } from 'vue';

const props = defineProps<{
  entity: Record<string, unknown>;
  uiNamespace: string;
  banners?: { key: string }[];
}>();

const lifecycleBannersCard = loadAsyncComponent('LinPulsar/LifecycleBannersCard');

const displayedBanners = computed(() => (props.banners ?? []).filter(({ key }) => key !== 'suspended' || props.entity.status === 'SUSPENDED'));
</script>

<template>
  <component
    :is="lifecycleBannersCard"
    v-if="lifecycleBannersCard"
    :ui-namespace="props.uiNamespace"
    i18n-scope="AccountLifecyclePanel"
    :entity="props.entity"
    :banners="displayedBanners"
    emit-on-click="account-lifecycle-action"
  />
</template>
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

# **LifecyclePanel ♻️**

The **LifecyclePanel** component displays and runs the lifecycle of an entity (activation, suspension, deactivation and
reactivation) on a details page, configured only through the `props` of its zone entry. It holds no entity-specific
code: an entity's capabilities are defined by the lifecycle data it exposes and by the actions configured for it. It
is built from a [LifecycleBannersCard](../card/LifecycleBannersCard.md) and a
[LifecycleButtonsCard](../card/LifecycleButtonsCard.md).

---

## **🎯 Purpose**

- Reads the status, validity period, suspension period and activation date of the entity, from configurable paths
- Displays the banners and info texts matching the lifecycle state, with their formatted dates
- Offers the actions matching the lifecycle state in one dropdown per lifecycle type, and in the banner buttons
- Offers only the configured actions: an action that is not configured is never displayed
- Runs an action: confirmation or form dialog, request rendered from templates, notification and reload event

---

## **⚙️ Props**

| Prop name                 | Type                                                   | Default                               | Description                                                                                                                                  |
| ------------------------- | ------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`                 | `Partial<Record<LifecycleActionKey, LifecycleAction>>` | `{}`                                  | Actions of the entity, indexed by action key. An action that is not configured is never offered, neither by the dropdowns nor by the banners |
| `fields`                  | `Partial<LifecycleFieldMapping>`                       | `{}`                                  | Entity paths of the lifecycle data, merged with the default paths (see [Lifecycle state](#-lifecycle-state))                                 |
| `enabledStates`           | `String[]`                                             | `['ACTIVE', 'SUSPENDED', 'INACTIVE']` | Statuses for which the panel is displayed. Outside this list, nothing is displayed                                                           |
| `deactivationWarningDays` | `Number`                                               | `15`                                  | Number of days before the validity end from which the `deactivationWarning` banner replaces the `willDeactivate` info text                   |
| `immediateActionDelay`    | `Number`                                               | `5`                                   | Delay in minutes between the submission of an action and `immediateDate`, also provided as `count` to the notifications                      |
| `dateFormatKey`           | `String`                                               | `'application.dateFormat'`            | Global i18n key of the format of the dates displayed by the banners and the info texts                                                       |
| `emitOnSubmit`            | `String`                                               | `undefined`                           | Event key published on `uiEventSubject` after a successful action, with the response body as data, for example to reload the entity          |
| `entity`                  | `Record<string, unknown>`                              | `{}`                                  | Entity whose lifecycle is displayed, provided to the templates of the actions. Injected by the hosting zone                                  |
| `instanceId`              | `String`                                               | `undefined`                           | Instance identifier passed to the form dialog fields and to the components hosted by the zones. Injected by the hosting zone                 |
| `uiNamespace`             | `String`                                               | —                                     | Base UI namespace used for design system customization. Injected by the hosting zone                                                         |
| `i18nScope`               | `String`                                               | —                                     | Identifier used to scope translations. Injected by the hosting zone                                                                          |

### LifecycleAction

| Property             | Type                                | Default  | Description                                                                                                                           |
| -------------------- | ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `url`                | `String`                            | —        | Request URL, as a Nunjucks template rendered with the [template context](#template-context)                                           |
| `method`             | `'DELETE' \| 'POST' \| 'PUT'`       | `'POST'` | HTTP method of the request                                                                                                            |
| `body`               | `Record<string, unknown>`           | `{}`     | JSON body of the request, rendered with the [template context](#template-context) by `renderJson` (see [Request body](#request-body)) |
| `formFields`         | `LinPulsarAttributeConfiguration[]` | `[]`     | Fields of the form dialog (see [FormDialog](../dialog/FormDialog.md)). Without fields, a confirmation dialog is opened instead        |
| `fillFormWithEntity` | `Boolean`                           | `false`  | Whether the form dialog is pre-filled with a deep copy of the entity, for example to modify a period                                  |

`LifecycleActionKey` is one of `activation.immediate`, `activation.scheduled`, `suspension.immediate`,
`suspension.scheduled`, `suspension.modify`, `deactivation.immediate`, `deactivation.scheduled`, `deactivation.modify`,
`reactivation.immediate`, `revalidation.immediate` and `revalidation.scheduled`.

---

## **♻️ Lifecycle state**

The panel reads the lifecycle state of the entity from the paths of the `fields` prop, in dot notation:

| Key                      | Default entity path      | Used for                                                                    |
| ------------------------ | ------------------------ | --------------------------------------------------------------------------- |
| `status`                 | `status`                 | `ACTIVE`, `SUSPENDED` or `INACTIVE`                                         |
| `validityStart`          | `validityPeriod.start`   | Future activation                                                           |
| `validityEnd`            | `validityPeriod.end`     | Scheduled deactivation, deactivation warning, deactivated state             |
| `suspensionStart`        | `suspensionPeriod.start` | Future suspension, start of the current suspension                          |
| `suspensionEnd`          | `suspensionPeriod.end`   | End of the current suspension                                               |
| `activationAt`           | `activationAt`           | Never-activated state                                                       |
| `daysBeforeDeactivation` | `daysBeforeDeactivation` | Days before the validity end, computed from `validityEnd` when not a number |

Prefer the number of days computed by the API when it exposes one: the panel computes it in the time zone of the
browser, which can differ by one day around midnight from the computation of the API.

### State matrix

The state computes the banners, the info texts and the dropdown actions. For each status, the **first matching row
wins**, in this order:

| Status      | Condition                                                        | Banners                            | Info texts                                                     | Dropdown actions                                                                                   |
| ----------- | ---------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `INACTIVE`  | Validity start in the future                                     | —                                  | —                                                              | `activation.immediate`, `activation.scheduled`, `suspension.scheduled`, `deactivation.scheduled`   |
| `INACTIVE`  | Never activated                                                  | —                                  | `notActivated`                                                 | `suspension.scheduled`, `deactivation.scheduled`                                                   |
| `INACTIVE`  | Validity end passed                                              | `deactivated`                      | —                                                              | —                                                                                                  |
| `INACTIVE`  | Otherwise                                                        | —                                  | —                                                              | —                                                                                                  |
| `ACTIVE`    | Validity end within `deactivationWarningDays`, boundary included | `deactivationWarning`              | `willSuspend` when a suspension starts later                   | `suspension.immediate`, `suspension.scheduled`                                                     |
| `ACTIVE`    | Validity end beyond `deactivationWarningDays`                    | —                                  | `willDeactivate`, `willSuspend` when a suspension starts later | `suspension.immediate`, `suspension.scheduled`, `deactivation.immediate`, `deactivation.modify`    |
| `ACTIVE`    | No validity end                                                  | —                                  | `willSuspend` when a suspension starts later                   | `suspension.immediate`, `suspension.scheduled`, `deactivation.immediate`, `deactivation.scheduled` |
| `SUSPENDED` | Validity end within `deactivationWarningDays`                    | `suspended`, `deactivationWarning` | —                                                              | `deactivation.immediate`, `deactivation.scheduled`                                                 |
| `SUSPENDED` | Otherwise                                                        | `suspended`                        | `willDeactivate` when a validity end is set                    | `deactivation.immediate`, `deactivation.scheduled`                                                 |
| Other       | —                                                                | —                                  | —                                                              | —                                                                                                  |

The banners offer their own buttons:

| Banner                | Buttons                                            | Content parameters                                                                                                            |
| --------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `suspended`           | `reactivation.immediate`, `suspension.modify`      | `date` (suspension start), `endDate` (suspension end); `contentWithEndDate` replaces `content` when the suspension has an end |
| `deactivated`         | `revalidation.immediate`, `revalidation.scheduled` | `date` (validity end)                                                                                                         |
| `deactivationWarning` | `deactivation.immediate`, `deactivation.modify`    | `date` (validity end), `count` (days before deactivation, selecting the plural form)                                          |

The info texts receive `date`: the validity end for `willDeactivate`, the suspension start for `willSuspend`, and an
empty string for `notActivated`.

**Displayed actions = matrix actions ∩ configured actions.** An entity that only configures the suspension and
reactivation actions, such as an organizational unit, never shows the activation or deactivation dropdowns, and a
banner button whose action is not configured is not rendered.

---

## **📨 Actions**

### Template context

The `url` and the `body` of an action are rendered with:

| Variable        | Content                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `entity`        | The entity, merged with the submitted form data: the top-level properties of the form replace the entity's                                                                                                                                 |
| `form`          | The submitted form data, nested as named by the form fields (`suspensionPeriod.start` → `form.suspensionPeriod.start`). With `fillFormWithEntity`, the dialog submits all its pre-filled data, so `form` also holds the copy of the entity |
| `lifecycle`     | The [lifecycle state](#-lifecycle-state)                                                                                                                                                                                                   |
| `immediateDate` | ISO date `immediateActionDelay` minutes after the submission                                                                                                                                                                               |

`immediateDate` is the start date of the immediate actions, such as an immediate suspension: the API refuses a start
date in the past, so the date is computed on submission, not when the dialog opens, and pushed `immediateActionDelay`
minutes later.

### Request body

The `body` is a JSON object rendered by `renderJson` of `lin-pulsar-core`: a string made of a single
`{{ expression }}` keeps the JSON type of its value, while any other string stays a string.

```json
{
  "suspensionPeriod": {
    "start": "{{ form.suspensionPeriod.start }}",
    "end": "{{ form.suspensionPeriod.end or none }}"
  },
  "reason": "{{ form.statusReason }}",
  "comment": "{{ form.statusComment or none }}"
}
```

- `none` is the Nunjucks `null` literal: `{{ form.statusComment or none }}` sends `null` for an empty comment, while
  `{{ form.statusComment }}` would send an empty string. An expression without value, such as a missing property, sends
  `null`.
- A value holding quotes or braces, such as a free-text comment, is always sent as a single string: it cannot change
  the structure of the body.
- The date fields of the form send the format of their `valueFormatI18NKey` (see
  [EntityAttributeDateField](../field/EntityAttributeDateField.md)): an ISO format such as `YYYY-MM-DDTHH:mm:ssZ` needs
  no conversion in the template.
- The body is not sent when it is empty.

### Run

- Clicking a dropdown item or a banner button runs its action. Actions are only offered when they are configured.
- An action with `formFields` opens the shared form dialog, pre-filled with a deep copy of the entity when
  `fillFormWithEntity` is enabled: fields with a nested name, such as `suspensionPeriod.end`, are pre-filled from the
  nested entity properties, and editing them never changes the entity of the page. An action without `formFields`
  opens the shared confirmation dialog.
- Once the dialog is confirmed, the request is sent. On success, the user is notified and `emitOnSubmit` is published
  with the response body, typically listed in the `reloadDetailsOn` option of the details page, which reloads the
  entity: the panel then computes the new state.
- On failure, whether a template cannot be rendered or the request fails, the user is notified. The form dialog stays
  open for correction, while the confirmation dialog closes.

---

## **🧩 Zones**

| Zone                                                            | Description                        |
| --------------------------------------------------------------- | ---------------------------------- |
| `[UI_NAMESPACE].lifecycle-panel.lifecycle-buttons-card.prepend` | Rendered before the first dropdown |
| `[UI_NAMESPACE].lifecycle-panel.lifecycle-buttons-card.append`  | Rendered after the last dropdown   |

Both zones are those of the [LifecycleButtonsCard](../card/LifecycleButtonsCard.md#-zones) of the panel.

---

## **🌍 Internationalization**

All keys live under `[I18N_SCOPE].LifecyclePanel`, `[ACTION_KEY]` being the key of an action, for example
`suspension.immediate`, and `[DIALOG]` being `FormDialog` or `ConfirmationDialog` depending on the `formFields` of the
action:

| Key                                                       | Description                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `LifecycleBannersCard.[BANNER].content`                   | Content of a banner, receiving its [content parameters](#state-matrix)             |
| `LifecycleBannersCard.suspended.contentWithEndDate`       | Content of the `suspended` banner when the suspension has an end                   |
| `LifecycleBannersCard.[BANNER].actions.[ACTION_KEY]`      | Label of a banner button                                                           |
| `infoTexts.[INFO_TEXT]`                                   | Message of an info text, receiving `date`                                          |
| `LifecycleButtonsCard.ButtonsCard.title`                  | Title of the dropdowns card (hidden when the key does not exist)                   |
| `LifecycleButtonsCard.[TYPE].DropdownButton.title`        | Label of the `[TYPE]` dropdown: `activation`, `suspension` or `deactivation`       |
| `LifecycleButtonsCard.[TYPE].DropdownButton.[ACTION_KEY]` | Label of a dropdown item                                                           |
| `actions.[ACTION_KEY].[DIALOG].title`                     | Title of the dialog of the action                                                  |
| `actions.[ACTION_KEY].[DIALOG].content`                   | Content of the dialog of the action (optional)                                     |
| `actions.[ACTION_KEY].[DIALOG].ButtonsCard`               | Labels of the dialog buttons (see [ButtonsCard](../card/ButtonsCard.md))           |
| `actions.[ACTION_KEY].FormDialog.fields`                  | Labels and messages of the form fields (see [FormDialog](../dialog/FormDialog.md)) |
| `actions.[ACTION_KEY].submitSuccess`                      | Success notification of the action, falling back to `submitSuccess`                |
| `actions.[ACTION_KEY].submitError`                        | Error notification of the action, falling back to `submitError`                    |
| `submitSuccess`                                           | Default success notification of the actions                                        |
| `submitError`                                             | Default error notification of the actions                                          |

The dialog title and content receive the entity properties as named parameters, and the notifications the entity
properties merged with the submitted form data, plus `immediateActionDelay` as `count`, which also selects the plural
form, for example `"Suspended in one minute | Suspended in {count} minutes"`.

Default `fr-FR` and `en-US` labels, worded for any entity, are shipped by the federated remote
`LinPulsar/DetailsPageI18n`, under the `{{ config.instanceId }}.LifecyclePanel` key: the notifications, the banners,
the info texts, the dropdowns and the title and buttons of the dialogs of every action, `activation.immediate` being a
confirmation dialog and the others form dialogs. The form fields depend on the host and have no default labels. These
defaults only apply when the panel is placed in a zone of a module whose `i18nRemote` is `LinPulsar/DetailsPageI18n`
(see [GenericDetailsPage](../../pages/GenericDetailsPage.md#internationalization)): each module words them for its own
entity in its translations.

---

## **🎨 UI Design**

The namespace is `[UI_NAMESPACE].lifecycle-panel`:

- the banners use the `lifecycle-banners-card` sub-namespace (see [LifecycleBannersCard](../card/LifecycleBannersCard.md));
- each info text uses `info-texts.[INFO_TEXT]` for its `q-icon`, rendered only when the design defines its `name`, and
  its `q-item-label`, whose `class` sets the color of the message;
- the dropdowns use the `lifecycle-buttons-card` sub-namespace (see [LifecycleButtonsCard](../card/LifecycleButtonsCard.md));
- the dialogs use the `form-dialog` and `confirmation-dialog` sub-namespaces.

See the [design documentation](../../design.md#lifecyclepanel).

---

## **🧩 Usage Examples**

### Account

```json
{
  "zone": "moduleAccountDetailsPage.content.before",
  "plugin": "LinPulsar/LifecyclePanel",
  "props": {
    "immediateActionDelay": 60,
    "emitOnSubmit": "lifecycle-updated",
    "actions": {
      "activation.immediate": {
        "url": "/accounts/{{ entity.id }}/status/schedule-activation",
        "method": "PUT",
        "body": { "validityStart": "{{ immediateDate }}" }
      },
      "suspension.scheduled": {
        "url": "/accounts/{{ entity.id }}/status/suspend",
        "method": "PUT",
        "formFields": [
          {
            "name": "suspensionPeriod.start",
            "type": "String",
            "input": "Date",
            "required": true,
            "inputSettings": {
              "maskI18NKey": "application.dateFormat",
              "valueFormatI18NKey": "application.dateFormatApi"
            }
          },
          { "name": "statusReason", "type": "String", "input": "Text", "required": true },
          { "name": "statusComment", "type": "String", "input": "TextArea" }
        ],
        "body": {
          "suspensionPeriod": {
            "start": "{{ form.suspensionPeriod.start }}",
            "end": "{{ form.suspensionPeriod.end or none }}"
          },
          "reason": "{{ form.statusReason }}",
          "comment": "{{ form.statusComment or none }}"
        }
      },
      "reactivation.immediate": {
        "url": "/accounts/{{ entity.id }}/status/reactivate",
        "method": "PUT",
        "formFields": [{ "name": "statusComment", "type": "String", "input": "TextArea", "required": true }],
        "body": { "comment": "{{ form.statusComment }}" }
      }
    }
  }
}
```

With `"reloadDetailsOn": ["lifecycle-updated"]` in the options of the details page, the entity is reloaded after each
action, and the panel displays its new state.

### Organizational unit

The same plugin, with fewer actions: an organizational unit has neither a validity period nor an activation date, so
the activation and deactivation dropdowns never show up.

```json
{
  "zone": "moduleOrganizationalUnitDetailsPage.content.before",
  "plugin": "LinPulsar/LifecyclePanel",
  "props": {
    "enabledStates": ["ACTIVE", "SUSPENDED"],
    "emitOnSubmit": "lifecycle-updated",
    "actions": {
      "suspension.immediate": {
        "url": "/organizational-units/{{ entity.id }}/status/suspend",
        "method": "PUT",
        "formFields": [
          { "name": "reason", "type": "String", "input": "Text", "required": true },
          { "name": "subreason", "type": "String", "input": "Text", "required": true }
        ],
        "body": {
          "suspensionPeriod": { "start": "{{ immediateDate }}", "end": null },
          "reason": "{{ form.reason }}",
          "subreason": "{{ form.subreason }}"
        }
      },
      "reactivation.immediate": {
        "url": "/organizational-units/{{ entity.id }}/status/reactivate",
        "method": "PUT",
        "formFields": [{ "name": "comment", "type": "String", "input": "TextArea", "required": true }],
        "body": { "comment": "{{ form.comment }}" }
      }
    }
  }
}
```

### Entity with other paths

Until the lifecycle API is harmonized across entities, `fields` absorbs the differences:

```json
{
  "props": {
    "fields": { "status": "state", "suspensionStart": "suspension.from", "suspensionEnd": "suspension.to" }
  }
}
```

---

## **🧪 Testing**

| Element                  | `data-cy`                                      |
| ------------------------ | ---------------------------------------------- |
| Panel                    | `lifecycle-panel`                              |
| Info text `[INFO_TEXT]`  | `lifecycle-panel_[INFO_TEXT]`                  |
| Banner `[BANNER]`        | `lifecycle-banners-card_[BANNER]`              |
| Button of a banner       | `lifecycle-banners-card_[BANNER]_[ACTION_KEY]` |
| Dropdown of the `[TYPE]` | `lifecycle-buttons-card_[TYPE]`                |
| Item of a dropdown       | `dropdown-button_item_[ACTION_KEY]`            |

---

## **🎨 CSS Classes**

- `.lifecycle-panel` - Main panel container
- `.lifecycle-panel--[INFO_TEXT]` - Info text `[INFO_TEXT]`

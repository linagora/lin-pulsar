# **EntityAvatar 👤**

The **EntityAvatar** component renders a deterministic [DiceBear](https://www.dicebear.com/) avatar
generated from the provided entity.

The avatar seed is rendered from Nunjucks templates with the entity as context, so the same entity
always produces the same avatar. The generation logic is shared with
[EntityProfilePanel](../panel/EntityProfilePanel.md), making the avatar displayed in a table, a card
or a list the same generated avatar as the profile page — not the stored image: a profile
displaying an uploaded image (`avatarLocation`) shows that image instead, which EntityAvatar never
renders.

---

## **🎯 Purpose**

- Displays a DiceBear avatar generated locally, without any network call
- Generates a deterministic seed from the entity through Nunjucks templates
- Falls back to a configurable icon when no avatar can be generated
- Sizes and styles through the design configuration, with no dedicated prop

---

## **⚙️ Props**

| Prop name       | Type                              | Default | Description                                                                      |
| --------------- | --------------------------------- | ------- | -------------------------------------------------------------------------------- |
| `entity`        | `Record<string, unknown> \| null` | —       | Entity the avatar seed templates are rendered with. Injected by the hosting zone |
| `avatarOptions` | `AvatarOptions`                   | —       | DiceBear generation options; when absent, the fallback icon is displayed         |
| `instanceId`    | `String`                          | —       | Instance identifier, used as UI namespace and i18n scope fallback                |
| `uiNamespace`   | `String`                          | —       | Base UI namespace for the design configuration                                   |
| `i18nScope`     | `String`                          | —       | Identifier used to scope translations                                            |

### AvatarOptions

| Property       | Type                      | Description                                                                                            |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `seed`         | `String[]`                | Nunjucks templates rendered with `{ entity }` and joined to form the seed, e.g. `["{{ entity.uid }}"]` |
| `style`        | `String`                  | DiceBear style name, e.g. `"adventurer"`, `"bottts"`, `"lorelei"`                                      |
| `styleOptions` | `Record<string, unknown>` | Optional style-specific options forwarded to DiceBear (backgroundColor, radius, etc.)                  |

`styleOptions` must be plain, structured-cloneable data: DiceBear deep-clones the object with
`structuredClone`.

---

## **🧩 Internal Behavior**

- The seed templates are rendered with a context containing `entity`, joined, and handed to the
  configured DiceBear style, loaded lazily and cached across the application
- The avatar is regenerated whenever the entity or the options change
- When `avatarOptions` is absent, the entity is not resolved yet (empty), or the generation fails
  (for example on an unknown style), the fallback icon is displayed instead, without any error —
  rendering the seed templates on an empty entity would give every entity the same avatar

---

## **🌍 Internationalization**

All keys are resolved under `${i18nScope}.EntityAvatar`, the `i18nScope` prop falling back to the
`instanceId` prop. When neither is provided, the scope is `EntityAvatar` alone:

| Key         | Description                                                                       |
| ----------- | --------------------------------------------------------------------------------- |
| `avatarAlt` | Alt text of the generated image; falls back to `"Avatar"` when the key is missing |

```json
{
  "EntityAvatar": {
    "avatarAlt": "Profile picture"
  }
}
```

---

## **🎨 UI Design**

All keys are resolved under `${uiNamespace}.entity-avatar`, the `uiNamespace` prop falling back to
the `instanceId` prop. When neither is provided, the namespace is `entity-avatar` alone:

```json
{
  "[NAMESPACE]": {
    "entity-avatar": {
      "q-avatar": { "size": "42px" },
      "q-icon": { "name": "person", "color": "grey-6" }
    }
  }
}
```

The avatar size is configured through the `q-avatar` `size` key. The `q-icon` key styles the
fallback icon displayed when no avatar is generated.

---

## **🧩 Usage Examples**

### In a GenericEntityTable column

The avatar is registered in the column zone of the table (see
[GenericEntityTable](../table/GenericEntityTable.md)). The hosting zone injects the row `entity`,
`uiNamespace` and `i18nScope`.

```json
{
  "zone": "moduleAccountsPage.columns.avatar",
  "plugin": "catalogUI/EntityAvatar",
  "props": {
    "avatarOptions": {
      "seed": ["{{ entity.uid }}"],
      "style": "adventurer"
    }
  }
}
```

### Direct usage

```vue
<EntityAvatar :entity="account" :avatar-options="{ seed: ['{{ entity.uid }}'], style: 'adventurer' }" ui-namespace="accounts.list" i18n-scope="accounts.list" />
```

---

## **✅ Advantages**

- **Deterministic:** The same entity always produces the same avatar
- **Consistent:** Shares the generation logic of EntityProfilePanel, so a table shows the same
  generated avatar as the profile page (not the stored image)
- **Zone-ready:** Designed to be rendered through a zone, such as a GenericEntityTable column

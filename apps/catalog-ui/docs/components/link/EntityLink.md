# **EntityLink 🔗**

The **EntityLink** component renders a link whose destination and label are dynamically generated
from the provided entity, the navigation being handled by the Vue Router.

The destination is rendered from a Nunjucks template and the label is resolved through i18n with
the entity as interpolation context, so a contextual link is driven by configuration alone: no
dedicated component is needed to expose a link towards the page of a related entity.

---

## **🎯 Purpose**

- Displays a link navigating to a configurable destination
- Resolves the destination from a Nunjucks template rendered with the entity
- Resolves the label through i18n, interpolated with the entity attributes
- Renders as a link handled by the Vue Router: a click stays in the single-page application, while
  the browser link controls keep working (open in a new tab, copy the link)

---

## **⚙️ Props**

| Prop name           | Type                              | Default | Description                                                                                                                                  |
| ------------------- | --------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `to`                | `String`                          | —       | Link destination, defined as a Nunjucks template                                                                                             |
| `entity`            | `Record<string, unknown> \| null` | —       | Entity used to render the destination and interpolate the label. Injected by the hosting zone                                                |
| `routeDependencies` | `String[]`                        | —       | Paths of the values the `to` template needs (e.g. `["entity.id"]`): while any is empty the label is rendered as plain text instead of a link |
| `instanceId`        | `String`                          | —       | Instance identifier, used as i18n scope fallback                                                                                             |
| `uiNamespace`       | `String`                          | —       | Base UI namespace, accepted for zone consistency; the component holds no Quasar element                                                      |
| `i18nScope`         | `String`                          | —       | Identifier used to scope translations                                                                                                        |

### Templating

The `to` prop is a Nunjucks template, rendered with a context containing `entity`:

```typescript
{
  to: '/accounts/{{ entity.id }}',
}
```

The component works when `entity` is `null`: the template is then rendered with an empty entity,
which suits static destinations such as `/accounts/import`.

When the destination interpolates entity values, declare them in `routeDependencies` (dot paths in
the template's own context, as in `FieldDynamicListSettings`): while any declared value is empty
(`null`, `undefined`, a blank string or an empty array), the label is rendered as plain text
instead of a link, so an unresolved entity never navigates to a wrongly rendered destination:

```typescript
{
  to: '/accounts/{{ entity.id }}',
  routeDependencies: ['entity.id'],
}
```

Rendered values are not URL-encoded: apply the `urlencode` filter to interpolated values, in path
segments as well as in query strings, for example `/accounts/{{ entity.id | urlencode }}` or
`/accounts?search={{ entity.name | urlencode }}`.

---

## **🧩 Internal Behavior**

- The `to` template is rendered with a context containing `entity`, trimmed, and bound as a router
  link: a click navigates through the router, while `Ctrl`, `Cmd` or middle click opens the
  destination in a new tab
- While a `routeDependencies` path holds no value, the label is rendered as a plain `span`
  (`data-cy="entity-link_unresolved"`) instead of a link; `0` and `false` count as values
- The label is the `title` translation, resolved with the entity attributes as interpolation
  context

---

## **🌍 Internationalization**

All keys are resolved under `${i18nScope}.EntityLink`, the `i18nScope` prop falling back to the
`instanceId` prop. When neither is provided, the scope is `EntityLink` alone:

| Key     | Description                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `title` | Label of the link, interpolated with the entity attributes without a prefix: write `{firstname}`, not `{entity.firstname}` |

```json
{
  "EntityLink": {
    "title": "View {firstname} {lastname}"
  }
}
```

---

## **🎨 UI Design**

The component renders a plain router link without any Quasar element, so it exposes no UI design
key.

---

## **🧩 Usage Examples**

### Through a zone configuration

The link is declared in the `zones` property of the module host configuration (see
[Generic Pages](../../generic-pages.md)). The hosting zone injects `instanceId`, `uiNamespace` and
`i18nScope`, along with the row `entity` when it renders entity content.

```json
{
  "zone": "moduleAccountsPage.row-actions",
  "plugin": "catalogUI/EntityLink",
  "props": {
    "to": "/accounts/{{ entity.id }}",
    "routeDependencies": ["entity.id"]
  }
}
```

### Direct usage

```vue
<EntityLink :entity="account" to="/accounts/{{ entity.id }}" ui-namespace="accounts.list" i18n-scope="accounts.list" />
```

---

## **✅ Advantages**

- **Standardized:** One consistent way to expose a contextual link
- **Configurable:** Destination and label are driven by configuration
- **Zone-ready:** Designed to be rendered through a zone, with or without an injected entity

<!--
  Copyright (C) 2026 Linagora

  This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General
  Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option)
  any later version, provided you comply with the Additional Terms applicable for LinOpenFactory software by
  LINAGORA pursuant to Section 7 of the GNU Affero General Public License, subsections (b), (c), and (e), pursuant to
  which these Appropriate Legal Notices must notably (i) retain the display of the "LinOpenFactory™" trademark/logo at the top
  of the interface window, the display of the “You are using the Open Source and free version of LinOpenFactory™, powered by
  Linagora © 2009–2026. Contribute to LinOpenFactory R&D by subscribing to an Enterprise offer!” infobox and in the e-mails
  sent with the Program, notice appended to any type of outbound messages (e.g. e-mail and meeting requests) as well
  as in the LinOpenFactory user interface, (ii) retain all hypertext links between LinOpenFactory
  and https://linid.org/, as well as between LINAGORA and LINAGORA.com, and (iii) refrain from infringing LINAGORA
  intellectual property rights over its trademarks and commercial brands. Other Additional Terms apply, see
  <http://www.linagora.com/licenses/> for more details.

  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
  warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
  details.

  You should have received a copy of the GNU Affero General Public License and its applicable Additional Terms for
  LinOpenFactory along with this program. If not, see <http://www.gnu.org/licenses/> for the GNU Affero
  General Public License version 3 and <http://www.linagora.com/licenses/> for the Additional Terms applicable to the
  LinOpenFactory software.
-->

<template>
  <!-- v8 ignore start -->
  <q-field
    :model-value="selectedValues"
    :data-cy="`field_${definition.name}`"
    class="entity-attribute-grouped-dynamic-list-field"
    stack-label
    borderless
    v-bind="uiProps.field"
    :disable="isDisabled"
    :label="translateOrDefault('', 'label')"
    :hint="translateOrDefault('', 'hint')"
    :rules="rules"
    no-error-icon
  >
    <template #control>
      <q-list
        class="full-width"
        v-bind="uiProps.list"
      >
        <q-item
          v-for="row in rows"
          :key="row.key"
          class="entity-attribute-grouped-dynamic-list-field__item q-px-none"
          :data-cy="`field_${definition.name}_${row.key}`"
          v-bind="uiProps.item"
        >
          <q-item-section
            class="col-12 col-sm-4"
            v-bind="uiProps.itemSection"
          >
            <q-item-label v-bind="uiProps.itemLabel">
              {{ row.label }}
            </q-item-label>
            <q-item-label
              v-if="row.caption"
              v-bind="uiProps.itemCaption"
            >
              {{ row.caption }}
            </q-item-label>
          </q-item-section>
          <q-item-section
            class="col-12 col-sm-8"
            v-bind="uiProps.fieldSection"
          >
            <EntityAttributeDynamicListField
              :ui-namespace="localUiNamespace"
              :instance-id="instanceId"
              :i18n-scope="localI18nScope"
              :definition="innerDefinition"
              :entity="row.entity"
              :template-entity="row.templateEntity"
              :context="row.context"
              ignore-rules
              @update:entity="(updated) => updateRow(row, updated)"
            />
          </q-item-section>
        </q-item>
        <q-item
          v-if="isEmpty"
          v-bind="uiProps.empty"
        >
          <q-item-section
            avatar
            v-bind="uiProps.emptyAvatar"
          >
            <q-icon v-bind="uiProps.emptyIcon" />
          </q-item-section>
          <q-item-section v-bind="uiProps.emptyMessage">
            {{ translateOrDefault('', 'empty') }}
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </q-field>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import {
  getNestedValue,
  type LinPulsarAttributeConfiguration,
  type LinPulsarQFieldProps,
  type LinPulsarQIconProps,
  type LinPulsarQItemLabelProps,
  type LinPulsarQItemProps,
  type LinPulsarQItemSectionProps,
  type LinPulsarQListProps,
  setNestedValue,
  useNunjucks,
  useQuasarRules,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import type { ValidationRule } from 'quasar';
import { computed, watch } from 'vue';
import { useApiEndpointContext } from '../../composables/useApiEndpointContext';
import type {
  AttributeFieldProps,
  EntityAttributeFieldOutputs,
  FieldDynamicListSettings,
  FieldGroupedDynamicListSettings,
} from '../../types/field';
import EntityAttributeDynamicListField from './EntityAttributeDynamicListField.vue';

/** One item of the collection, as displayed in a row with its own dynamic list. */
interface GroupedRow {
  /** The key of the item, as a string. */
  key: string;
  /** The item of the collection. */
  item: Record<string, unknown>;
  /** The rendered label of the item. */
  label: string;
  /** The rendered caption of the item, empty without `itemCaption`. */
  caption: string;
  /** The entity given to the dynamic list of the row, its `field` attribute holding the selection of the item. */
  entity: Record<string, unknown>;
  /** The entity the templates of the dynamic list of the row read, undefined when they do not read it. */
  templateEntity: Record<string, unknown> | undefined;
  /** The context of the templates of the dynamic list of the row. */
  context: RowContext;
}

/** The context of the templates of the dynamic list of a row: a type, so that it is a `Record`. */
type RowContext = {
  /** The item of the row. */
  item: Record<string, unknown>;
};

/** The entity given to the dynamic list of a row, kept with the selection it was built from. */
interface KeptRowEntity {
  /** The selection of the item, serialized. */
  selection: string;
  /** The entity given to the dynamic list. */
  entity: Record<string, unknown>;
}

/** The attribute of the entity of a row holding its selection: it also names its i18n scope and ui namespace. */
const INNER_FIELD = 'field';

const props = withDefaults(
  defineProps<AttributeFieldProps<FieldGroupedDynamicListSettings>>(),
  {
    ignoreRules: false,
  }
);
const emits = defineEmits<EntityAttributeFieldOutputs>();
const localI18nScope = `${props.i18nScope}.fields.${props.definition.name}`;
const localUiNamespace = `${props.uiNamespace}.${props.definition.name}`;

const { ui } = useUiDesign();
const { translateOrDefault } = useScopedI18n(localI18nScope);
const { renderString } = useNunjucks();

const uiProps = {
  field: ui<LinPulsarQFieldProps>(localUiNamespace, 'q-field'),
  list: ui<LinPulsarQListProps>(`${localUiNamespace}.list`, 'q-list'),
  item: ui<LinPulsarQItemProps>(`${localUiNamespace}.item`, 'q-item'),
  itemSection: ui<LinPulsarQItemSectionProps>(
    `${localUiNamespace}.item-section`,
    'q-item-section'
  ),
  itemLabel: ui<LinPulsarQItemLabelProps>(
    `${localUiNamespace}.item-label`,
    'q-item-label'
  ),
  itemCaption: {
    caption: true,
    ...ui<LinPulsarQItemLabelProps>(
      `${localUiNamespace}.item-caption`,
      'q-item-label'
    ),
  },
  fieldSection: ui<LinPulsarQItemSectionProps>(
    `${localUiNamespace}.field-section`,
    'q-item-section'
  ),
  empty: ui<LinPulsarQItemProps>(`${localUiNamespace}.empty`, 'q-item'),
  emptyAvatar: ui<LinPulsarQItemSectionProps>(
    `${localUiNamespace}.empty-avatar`,
    'q-item-section'
  ),
  emptyIcon: {
    name: 'info',
    ...ui<LinPulsarQIconProps>(`${localUiNamespace}.empty-icon`, 'q-icon'),
  },
  emptyMessage: ui<LinPulsarQItemSectionProps>(
    `${localUiNamespace}.empty-message`,
    'q-item-section'
  ),
};

/** The input settings with their default values applied. */
const settings = computed(() => {
  const inputSettings = props.definition.inputSettings;

  return {
    items: inputSettings?.items ?? '',
    itemKey: inputSettings?.itemKey ?? 'id',
    keyProperty: inputSettings?.keyProperty ?? 'id',
    valuesProperty: inputSettings?.valuesProperty ?? 'values',
    itemLabel: inputSettings?.itemLabel ?? '',
    itemCaption: inputSettings?.itemCaption ?? '',
    field: inputSettings?.field ?? ({} as FieldDynamicListSettings),
    disable: Boolean(inputSettings?.disable),
    ignoreRules: Boolean(inputSettings?.ignoreRules),
  };
});

const isDisabled = computed(() => settings.value.disable);

/**
 * Reads the items of the collection of an entity, none when the path does not hold an array. An
 * item that is not an object, has no key (`null`, `undefined` or an empty string), or whose key an
 * earlier item holds, a number and its string being the same key, is skipped: it could not be told
 * apart from another one.
 * @param entity - The entity holding the collection.
 * @returns The items of the collection.
 */
function itemsOf(entity: Record<string, unknown>): Record<string, unknown>[] {
  const collection = getNestedValue(entity, settings.value.items);

  if (!Array.isArray(collection)) {
    return [];
  }
  const keys = new Set<string>();

  return collection.filter((item): item is Record<string, unknown> => {
    if (item === null || typeof item !== 'object') {
      return false;
    }
    const key = (item as Record<string, unknown>)[settings.value.itemKey];

    if (
      key === null ||
      key === undefined ||
      key === '' ||
      keys.has(String(key))
    ) {
      return false;
    }
    keys.add(String(key));
    return true;
  });
}

/**
 * Reads the entries of the stored value of an entity, none when it is not an array.
 * @param entity - The entity holding the value.
 * @returns The stored entries.
 */
function storedEntriesOf(entity: Record<string, unknown>): unknown[] {
  const stored = getNestedValue(entity, props.definition.name);

  return Array.isArray(stored) ? stored : [];
}

/**
 * Finds the stored entry of an item, a number and its string being the same key.
 * @param entries - The stored entries.
 * @param key - The key of the item, as a string.
 * @returns The entry, undefined when the item has none.
 */
function entryOf(
  entries: unknown[],
  key: string
): Record<string, unknown> | undefined {
  const { keyProperty } = settings.value;

  return entries.find(
    (candidate) =>
      candidate !== null &&
      typeof candidate === 'object' &&
      String((candidate as Record<string, unknown>)[keyProperty]) === key
  ) as Record<string, unknown> | undefined;
}

/**
 * Builds the value owned by the field from an entity: one entry per item of the collection, in its
 * order. A stored entry whose values are an array is kept as it is, its other properties and the type
 * of its key included; an item without such an entry gets one with an empty selection.
 * @param entity - The entity holding the collection and the stored value.
 * @returns The value of the field.
 */
function valueOf(entity: Record<string, unknown>): Record<string, unknown>[] {
  const { itemKey, keyProperty, valuesProperty } = settings.value;
  const entries = storedEntriesOf(entity);

  return itemsOf(entity).map((item) => {
    const entry = entryOf(entries, String(item[itemKey]));

    if (entry && Array.isArray(entry[valuesProperty])) {
      return entry;
    }
    return {
      ...entry,
      [keyProperty]: entry ? entry[keyProperty] : item[itemKey],
      [valuesProperty]: [],
    };
  });
}

const items = computed(() => itemsOf(props.entity));

/** The entries of the stored value, none when it is not an array. */
const storedEntries = computed(() => storedEntriesOf(props.entity));

/**
 * Reads the stored selection of an item.
 * @param key - The key of the item, as a string.
 * @returns The selected values, empty when the item has no entry or its values are not an array.
 */
function storedValuesOf(key: string): unknown[] {
  const values = entryOf(storedEntries.value, key)?.[
    settings.value.valuesProperty
  ];

  return Array.isArray(values) ? values : [];
}

const value = computed(() => valueOf(props.entity));

/**
 * Every selected value of every item, validated by the rules of the field. The same array is kept
 * while its values do not change: q-field validates again on every new model, and a change of
 * another attribute of the entity must not validate this field again.
 */
const selectedValues = computed<unknown[]>((previous) => {
  const next = value.value.flatMap(
    (entry) => entry[settings.value.valuesProperty] as unknown[]
  );

  return previous &&
    previous.length === next.length &&
    previous.every((selected, index) => selected === next[index])
    ? previous
    : next;
});

const isEmpty = computed(() => items.value.length === 0);

const innerDefinition = computed<
  LinPulsarAttributeConfiguration<FieldDynamicListSettings>
>(() => ({
  name: INNER_FIELD,
  type: props.definition.type,
  required: false,
  hasValidations: false,
  input: 'DynamicList',
  // Each list loads when it is opened, unless the settings say otherwise: a form opening with many
  // items then sends no request per item.
  inputSettings: {
    loadOnOpen: true,
    ...settings.value.field,
    multiple: true,
    ...(settings.value.disable ? { disable: true } : {}),
  },
}));

/**
 * Whether a template or a dependency path of the lists names `entity`: only then do they need the
 * whole entity, and render their options again whenever it changes.
 */
const listsReadEntity = computed(() => {
  const { route, optionLabel, optionValue, optionDisabled, routeDependencies } =
    settings.value.field;

  return [
    route,
    optionLabel,
    optionValue,
    optionDisabled,
    ...(routeDependencies ?? []),
  ].some(
    (template) => typeof template === 'string' && /\bentity\b/.test(template)
  );
});

/** The entity given to the list of each row by key, kept while its selection does not change. */
const rowEntities = new Map<string, KeptRowEntity>();
/** The context given to the list of each item, kept while the item does not change. */
const rowContexts = new WeakMap<Record<string, unknown>, RowContext>();

/**
 * Builds the entity given to the list of a row: it only holds the selection of the item, and is kept
 * as long as that selection does not change, so that an edit of another attribute does not render the
 * options of every row again. The templates of the list read the whole entity apart, through
 * `templateEntity`, so that no attribute of the entity is hidden by the selection.
 * @param key - The key of the item.
 * @returns The entity of the list of the row.
 */
function rowEntityOf(key: string): Record<string, unknown> {
  const values = storedValuesOf(key);
  const selection = JSON.stringify(values);
  const kept = rowEntities.get(key);

  if (kept?.selection === selection) {
    return kept.entity;
  }

  const entity = { [INNER_FIELD]: values };
  rowEntities.set(key, { selection, entity });
  return entity;
}

/**
 * Gives the context of the list of an item, the same object as long as the item is the same.
 * @param item - The item of the row.
 * @returns The context of the list of the row.
 */
function rowContextOf(item: Record<string, unknown>): RowContext {
  let context = rowContexts.get(item);

  if (!context) {
    context = { item };
    rowContexts.set(item, context);
  }
  return context;
}

const rows = computed<GroupedRow[]>(() =>
  items.value.map((item) => {
    const key = String(item[settings.value.itemKey]);
    const context = { entity: props.entity, item };

    return {
      key,
      item,
      label: renderString(settings.value.itemLabel, context),
      caption: settings.value.itemCaption
        ? renderString(settings.value.itemCaption, context)
        : '',
      entity: rowEntityOf(key),
      templateEntity: listsReadEntity.value ? props.entity : undefined,
      context: rowContextOf(item),
    };
  })
);

const apiEndpointContext = useApiEndpointContext();

/**
 * The rules of the field, carried by its `q-field` whose model is the flat list of the selected
 * values: `required` checks that list, while the API validation receives the stored value, the one
 * the form sends.
 */
const rules = computed<ValidationRule[]>(() => {
  if (props.ignoreRules || settings.value.ignoreRules) {
    return [];
  }

  const selectionRules = useQuasarRules(
    props.instanceId,
    { ...props.definition, hasValidations: false },
    [],
    localI18nScope,
    apiEndpointContext
  );
  const valueRules = useQuasarRules(
    props.instanceId,
    { ...props.definition, required: false },
    [],
    localI18nScope,
    apiEndpointContext
  );

  return [
    ...selectionRules,
    ...valueRules.map((rule): ValidationRule =>
      typeof rule === 'function'
        ? (_selection, embeddedRules) => rule(value.value, embeddedRules)
        : rule
    ),
  ];
});

/**
 * The entity the next update is built from: the last one emitted, until the parent gives the field a
 * new one. Several lists can emit before the parent renders again, such as every list clearing its
 * selection when the route they share changes: each update must keep the ones emitted before it.
 */
let latestEntity = props.entity;

watch(
  () => props.entity,
  (entity) => {
    latestEntity = entity;
  },
  { flush: 'sync' }
);

/**
 * Tells whether a value of the field matches the stored value: the same entries, whatever their
 * order. An entry that was rebuilt, an extra entry or a stored value that is not an array do not
 * match.
 * @param nextValue - The value of the field.
 * @returns True when the stored value already matches.
 */
function isStored(nextValue: Record<string, unknown>[]): boolean {
  const stored = getNestedValue(props.entity, props.definition.name);

  return (
    Array.isArray(stored) &&
    stored.length === nextValue.length &&
    nextValue.every((entry) => stored.includes(entry))
  );
}

// The value follows the collection: an item that appears starts with an empty selection, and the
// selection of an item that disappears is dropped. Nothing is emitted when it already matches.
watch(
  value,
  (nextValue) => {
    // A path that does not hold an array, such as an entity not loaded yet, says nothing about the
    // items: the stored selections are kept rather than erased.
    if (!Array.isArray(getNestedValue(props.entity, settings.value.items))) {
      return;
    }
    if (!isStored(nextValue)) {
      emitValue(nextValue);
    }
  },
  { immediate: true }
);

/**
 * Stores the selection made in the dynamic list of a row, keeping the selections of the other items.
 * @param row - The row whose selection changed.
 * @param updatedEntity - The entity emitted by the dynamic list of the row.
 */
function updateRow(row: GroupedRow, updatedEntity: Record<string, unknown>) {
  const { keyProperty, valuesProperty } = settings.value;
  const selection = getNestedValue(updatedEntity, INNER_FIELD);
  const values = Array.isArray(selection) ? selection : [];

  emitValue(
    valueOf(latestEntity).map((entry) =>
      String(entry[keyProperty]) === row.key
        ? { ...entry, [valuesProperty]: values }
        : entry
    )
  );
}

/**
 * Emits an 'update:entity' event with the entity holding the given value.
 * @param nextValue - The value of the field.
 */
function emitValue(nextValue: Record<string, unknown>[]) {
  latestEntity = setNestedValue(latestEntity, props.definition.name, nextValue);
  emits('update:entity', latestEntity);
}
</script>

<style scoped>
/* QItem never wraps: let each item wrap so that its label stacks above its list below `sm`, and
   drop the margin between its two main sections so that their widths add up to the full row. */
.entity-attribute-grouped-dynamic-list-field__item {
  flex-wrap: wrap;
}

/* The lists of the items have no rule, hint or error of their own: without the space a field keeps
   for them below itself, each list is centred on the label of its item. */
.entity-attribute-grouped-dynamic-list-field__item
  :deep(.q-field--with-bottom) {
  padding-bottom: 0;
}

.entity-attribute-grouped-dynamic-list-field__item
  > .q-item__section--main
  + .q-item__section--main {
  margin-left: 0;
}
</style>

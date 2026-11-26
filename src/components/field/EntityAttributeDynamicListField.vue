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
  <q-select
    v-model="localValue"
    :data-cy="`field_${definition.name}`"
    class="entity-attribute-dynamic-list-field"
    v-bind="uiProps.select"
    :disable="isDisabled"
    :label="translateOrDefault('', 'label')"
    :hint="translateOrDefault('', 'hint')"
    :prefix="translateOrDefault('', 'prefix')"
    :suffix="translateOrDefault('', 'suffix')"
    :options="allOptions"
    option-label="label"
    option-value="value"
    emit-value
    map-options
    :multiple="isMultiple"
    :use-chips="isMultiple"
    :rules="rules"
    :loading="isLoading"
    @virtual-scroll="onVirtualScroll"
    @popup-show="onPopupShow"
    @update:model-value="updateValue"
  >
    <template
      v-if="disabledText"
      #option="scope"
    >
      <q-item v-bind="{ ...uiProps.item, ...scope.itemProps }">
        <q-item-section v-bind="uiProps.section">
          <q-item-label v-bind="uiProps.label">
            {{ scope.opt.label }}
          </q-item-label>
          <q-item-label
            v-if="scope.opt.disable"
            v-bind="uiProps.disabledCaption"
          >
            {{ disabledText }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <!-- While the first page waits for the opening or loads, the slot lets the empty list open; once
         loaded, it says that the list is empty when the field has a noOption translation. -->
    <template
      v-if="displayedError || isWaitingForOpening || isLoading || noOptionText"
      #no-option
    >
      <q-item>
        <q-item-section
          v-if="displayedError"
          class="text-negative"
        >
          {{ displayedError }}
        </q-item-section>
        <q-item-section
          v-else-if="isWaitingForOpening || isLoading"
          class="items-center"
        >
          <q-spinner />
        </q-item-section>
        <q-item-section
          v-else
          v-bind="uiProps.noOption"
        >
          {{ noOptionText }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import {
  getNestedValue,
  type LinPulsarQItemLabelProps,
  type LinPulsarQItemProps,
  type LinPulsarQItemSectionProps,
  type LinPulsarQSelectProps,
  type Page,
  setNestedValue,
  useNunjucks,
  useQuasarRules,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useApiEndpointContext } from '../../composables/useApiEndpointContext';
import { getDynamicListPage } from '../../services/dynamicListService';
import { useRouteDependencies } from '../../composables/useRouteDependencies';
import type {
  DynamicListElement,
  DynamicListFieldProps,
  EntityAttributeFieldOutputs,
} from '../../types/field';

/** Payload received from the Quasar virtual scroll event. */
interface VirtualScrollPayload {
  /** The index of the last visible item. */
  to: number;
  /** Reference to the virtual scroll component. */
  ref: { /** Refreshes the virtual scroll. */ refresh: () => void } | null;
}

/** One paginated fetch from a single route, never reset but replaced whole: its identity is what `isStale` compares. */
interface PagedFetch {
  /** The route every request of this fetch reads from. */
  readonly route: string;
  /** Cancels the requests of this fetch when it is abandoned. */
  readonly controller: AbortController;
  /** The zero-based index of the next page to request. */
  nextPage: number;
  /** Whether the backend reported further pages. */
  hasMore: boolean;
  /** Whether a request of this fetch is awaiting its response. */
  hasPendingRequest: boolean;
}

const props = withDefaults(defineProps<DynamicListFieldProps>(), {
  ignoreRules: false,
  context: () => ({}),
});
const emits = defineEmits<EntityAttributeFieldOutputs>();
const localI18nScope = `${props.i18nScope}.fields.${props.definition.name}`;

const { ui } = useUiDesign();
const { translateOrDefault, t } = useScopedI18n(localI18nScope);
const { renderString } = useNunjucks();

const allOptions = ref<DynamicListElement[]>([]);
const isLoading = ref(false);
/** The failure of the last request, owned by its fetch: only a new request or `cancelFetch()` clears it. */
const error = ref<string | null>(null);
/** The fetch the list is currently filled from, `null` while the field has none. */
let currentFetch: PagedFetch | null = null;
/** The last route a request was opened on; outlives the fetches, `null` until the first one. */
let requestedRoute: string | null = null;
/** The elements the options are rendered from, kept so they can be rendered again when the entity changes. */
let loadedElements: DynamicListElement[] = [];
/**
 * Whether the first page waits for the list to be opened (`loadOnOpen`): true until the first opening, so that a form
 * repeating the field does not send one request per field when it opens.
 */
const isWaitingForOpening = ref(
  Boolean(props.definition.inputSettings?.loadOnOpen)
);

const pageSize = computed(() => props.definition.inputSettings?.size ?? 20);

/**
 * The numbers read as strings by `toOptionValue`, by string: the selection is emitted with them, so that a numeric
 * identifier keeps its type in the entity whether it was picked or left as it was.
 */
const numericValues = new Map<string, number>();

/**
 * Converts a number to a string: q-select compares the model with the option values strictly, and a rendered template
 * is always a string. The number is remembered, to be emitted back as a number.
 * @param value - The value of the entity or of a fetched element.
 * @returns The value, a number as a string, `null` when unset.
 */
function toOptionValue(value: unknown): unknown {
  if (typeof value === 'number') {
    numericValues.set(String(value), value);
    return String(value);
  }
  return value ?? null;
}

/** A template made of a single lookup, such as `{{ id }}`, capturing the path it reads. */
const SINGLE_LOOKUP = /^\{\{\s*([\w$.]+)\s*\}\}$/;

/**
 * Renders the `optionValue` template of an element. When the template is a single lookup of a number,
 * the number is remembered, to be emitted back as a number like the values `toOptionValue` reads.
 * @param template - The `optionValue` template.
 * @param context - The context of the element.
 * @returns The rendered option value.
 */
function renderOptionValue(
  template: string,
  context: Record<string, unknown>
): string {
  const rendered = renderString(template, context);
  const path = SINGLE_LOOKUP.exec(template.trim())?.[1];
  const lookedUp = path ? getNestedValue(context, path) : undefined;

  if (typeof lookedUp === 'number' && String(lookedUp) === rendered) {
    numericValues.set(rendered, lookedUp);
  }
  return rendered;
}

/**
 * Reads an option value back as the value it was converted from: a number read as a string is a number again.
 * @param value - An option value of the select.
 * @returns The value to store in the entity.
 */
function toEntityOptionValue(value: unknown): unknown {
  return typeof value === 'string' && numericValues.has(value)
    ? numericValues.get(value)
    : value;
}

/** Whether several options can be selected, the value then being an array of option values. */
const isMultiple = computed(() =>
  Boolean(props.definition.inputSettings?.multiple)
);

/**
 * Reads a value of the entity as the value of the select: an array of option values with `multiple`, an empty array
 * when unset, a single option value otherwise.
 * @param value - The value of the entity.
 * @returns The value of the select.
 */
function toFieldValue(value: unknown): unknown {
  if (!isMultiple.value) {
    return toOptionValue(value);
  }
  if (value == null) {
    return [];
  }
  return (Array.isArray(value) ? value : [value]).map(toOptionValue);
}

/**
 * Reads a value of the select as the value to store in the entity, each number read as a string being a number again.
 * @param value - The value of the select.
 * @returns The value of the entity.
 */
function toEntityValue(value: unknown): unknown {
  return Array.isArray(value)
    ? value.map(toEntityOptionValue)
    : toEntityOptionValue(value);
}

/**
 * Lists the option values held by a value of the select, whether it is single or multiple.
 * @param value - The value of the select.
 * @returns The option values, empty when nothing is selected.
 */
function toValueList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value == null ? [] : [value];
}

/**
 * Tells whether two values of the select hold the same option values, in the same order.
 * @param value - A value of the select.
 * @param other - Another value of the select.
 * @returns True when they hold the same option values.
 */
function isSameValue(value: unknown, other: unknown): boolean {
  const values = toValueList(value);
  const others = toValueList(other);

  return (
    values.length === others.length &&
    values.every((item, index) => item === others[index])
  );
}

const localValue = ref(
  toFieldValue(getNestedValue(props.entity, props.definition.name))
);
/**
 * The value the entity holds from outside the field, as opposed to one picked in it: its options are
 * never disabled, so the user can always come back to them after choosing others.
 */
let presetValue = localValue.value;

const localUiNamespace = `${props.uiNamespace}.${props.definition.name}`;

/** The option entries are only used when a `disabledText` translation calls for the two-line layout. */
const uiProps = {
  select: ui<LinPulsarQSelectProps>(localUiNamespace, 'q-select'),
  item: ui<LinPulsarQItemProps>(localUiNamespace, 'q-item'),
  section: ui<LinPulsarQItemSectionProps>(localUiNamespace, 'q-item-section'),
  label: ui<LinPulsarQItemLabelProps>(localUiNamespace, 'q-item-label'),
  noOption: ui<LinPulsarQItemSectionProps>(
    `${localUiNamespace}.no-option`,
    'q-item-section'
  ),
  /** A caption by default: the design configuration can still turn it into any other label style. */
  disabledCaption: {
    caption: true,
    ...ui<LinPulsarQItemLabelProps>(
      `${localUiNamespace}.disabled-caption`,
      'q-item-label'
    ),
  },
};

/** The message of a loaded list without option, empty when the field has no `noOption` translation. */
const noOptionText = computed(() => translateOrDefault('', 'noOption'));

/** The caption of a disabled option, empty when the field has no `disabledText` translation. */
const disabledText = computed(() => translateOrDefault('', 'disabledText'));

const apiEndpointContext = useApiEndpointContext();

const rules = computed(() =>
  !props.ignoreRules && !props.definition.inputSettings?.ignoreRules
    ? useQuasarRules(
        props.instanceId,
        props.definition,
        ['unique'],
        localI18nScope,
        apiEndpointContext
      )
    : []
);

/**
 * The context the route template and the dependency paths are both resolved against: the context
 * variables, and the entity, which a variable cannot hide.
 */
const renderContext = computed(() => ({
  ...props.context,
  entity: props.templateEntity ?? props.entity,
}));

const { areRouteDependenciesSatisfied: areDependenciesSatisfied } =
  useRouteDependencies(
    renderContext,
    () => props.definition.inputSettings?.routeDependencies ?? []
  );

const renderedRoute = computed(() =>
  renderString(props.definition.inputSettings?.route ?? '', renderContext.value)
);

/** No `route` in the configuration: read from the setting, not from what it rendered to. */
const configurationError = computed(() =>
  props.definition.inputSettings?.route
    ? null
    : t('validation.dynamicList.missingRoute')
);

/** What the `#no-option` slot displays: a broken configuration outranks a failed request. */
const displayedError = computed(() => configurationError.value ?? error.value);

/** Whether the select is non-interactive: either explicitly disabled, or missing a dependency. */
const isDisabled = computed(
  () =>
    Boolean(props.definition.inputSettings?.disable) ||
    !areDependenciesSatisfied.value
);

/**
 * Tells whether a list waiting for its opening loads at once: a disabled list is never opened, so it
 * loads as soon as it holds preset values to label, whether at mount or once the entity is loaded.
 * @returns True when the list must load without waiting for its opening.
 */
function isLoadedAtOnceWhileDisabled(): boolean {
  return (
    isWaitingForOpening.value &&
    isDisabled.value &&
    toValueList(localValue.value).length > 0
  );
}

watch(
  () => getNestedValue(props.entity, props.definition.name),
  (newValue) => {
    const value = toFieldValue(newValue);
    // A selection made here comes back through the parent already equal to `localValue`: only a
    // value set from outside, such as the entity once loaded, becomes the preset.
    if (!isSameValue(value, localValue.value)) {
      presetValue = value;
    }
    localValue.value = value;
    if (currentFetch && isLoadedAtOnceWhileDisabled()) {
      isWaitingForOpening.value = false;
      loadFirstPage(currentFetch);
    }
  }
);

watch(
  [areDependenciesSatisfied, renderedRoute],
  async ([areSatisfied, nextRoute]) => {
    if (!areSatisfied || !nextRoute || requestedRoute === nextRoute) {
      return;
    }

    cancelFetch();
    if (requestedRoute !== null) {
      clearSelection();
      presetValue = toFieldValue(null);
      loadedElements = [];
      allOptions.value = [];
    }
    requestedRoute = nextRoute;

    const pagedFetch = {
      route: nextRoute,
      controller: new AbortController(),
      nextPage: 0,
      hasMore: true,
      hasPendingRequest: false,
    };
    currentFetch = pagedFetch;

    if (isLoadedAtOnceWhileDisabled()) {
      isWaitingForOpening.value = false;
    }
    if (isWaitingForOpening.value) {
      // The preset values keep their placeholder until the list is opened and loaded.
      ensurePresetValueInOptions();
      return;
    }
    await loadFirstPage(pagedFetch);
  },
  { immediate: true }
);

// The templates read the entity and the context: a change of another field, such as a member added
// in the same form, can disable or re-enable options already loaded.
watch(
  [() => props.entity, () => props.templateEntity, () => props.context],
  refreshOptions,
  {
    deep: true,
  }
);

// Leaving the page is one more way for a fetch to become useless: abort it instead of paying for a
// response nobody will read.
onBeforeUnmount(cancelFetch);

/**
 * Loads the first page of a fetch, then gives a placeholder to each preset value it does not hold.
 * @param pagedFetch - The fetch to load, the current one.
 */
async function loadFirstPage(pagedFetch: PagedFetch) {
  await fetchPage();
  if (isStale(pagedFetch) || error.value) {
    return;
  }
  ensurePresetValueInOptions();
}

/**
 * Loads the first page when the list is opened for the first time, with `loadOnOpen`. Any later
 * route change then loads at once, like without it. A first page that failed is requested again on
 * each opening: without option, no scroll could request it.
 */
async function onPopupShow() {
  const pagedFetch = currentFetch;
  const hasFirstPageFailed =
    pagedFetch !== null &&
    pagedFetch.nextPage === 0 &&
    !pagedFetch.hasPendingRequest &&
    error.value !== null;

  if (!isWaitingForOpening.value && !hasFirstPageFailed) {
    return;
  }
  isWaitingForOpening.value = false;
  if (pagedFetch) {
    await loadFirstPage(pagedFetch);
  }
}

/**
 * Whether a fetch was replaced while it was awaiting, which makes its outcome no longer applicable.
 * @param pagedFetch - The fetch captured before the await.
 * @returns True when the fetch is no longer the current one.
 */
function isStale(pagedFetch: PagedFetch): boolean {
  return pagedFetch !== currentFetch;
}

/** Drops the selected values and the entity's, since they belong to a route that no longer applies. */
function clearSelection() {
  if (toValueList(localValue.value).length === 0) {
    return;
  }
  localValue.value = toFieldValue(null);
  updateValue();
}

/** Abandons the current fetch: aborts its request and drops it, so `isStale` discards a landed response. */
function cancelFetch() {
  currentFetch?.controller.abort();
  currentFetch = null;
  isLoading.value = false;
  error.value = null;
}

/** Fetches the next page of the current fetch and appends it to the options. */
async function fetchPage() {
  const pagedFetch = currentFetch;
  if (!pagedFetch || pagedFetch.hasPendingRequest || !pagedFetch.hasMore) {
    return;
  }

  pagedFetch.hasPendingRequest = true;
  isLoading.value = true;
  error.value = null;

  let page: Page<DynamicListElement> | undefined;
  try {
    page = await getDynamicListPage(
      pagedFetch.route,
      {
        page: pagedFetch.nextPage,
        size: pageSize.value,
      },
      pagedFetch.controller.signal
    );
  } catch {
    // An absent page is the failure, reported below once the fetch is known to be the current one.
    // A cancellation lands here too, and never reaches the report: aborting always goes with
    // replacing `currentFetch`, so the guard below has already returned.
  }

  pagedFetch.hasPendingRequest = false;

  if (isStale(pagedFetch)) {
    return;
  }

  isLoading.value = false;

  if (!page?.content) {
    error.value = t('validation.dynamicList.fetchError');
    return;
  }

  const options = mapOptions(page.content);
  if (!options) {
    return;
  }

  loadedElements.push(...page.content);
  if (options.length > 0) {
    allOptions.value.push(...options);
    removePlaceholderIfResolved();
  }
  pagedFetch.hasMore = !page.last;
  pagedFetch.nextPage++;
}

/**
 * Maps fetched elements to options. A template that fails to render is reported as a fetch error:
 * the list is as unusable as after a failed request, and the page is left to be requested again.
 * @param elements - The elements to map.
 * @returns The options, or `null` when a template failed.
 */
function mapOptions(
  elements: DynamicListElement[]
): DynamicListElement[] | null {
  try {
    return elements.map(toOption);
  } catch {
    error.value = t('validation.dynamicList.fetchError');
    return null;
  }
}

/** Renders the loaded elements again, with the placeholder the preset value may still need. */
function refreshOptions() {
  if (loadedElements.length === 0) {
    return;
  }

  const options = mapOptions(loadedElements);
  if (!options) {
    return;
  }

  allOptions.value = options;
  ensurePresetValueInOptions();
}

/**
 * Maps a fetched element to a dropdown option. When the `optionLabel`, `optionValue` or
 * `optionDisabled` settings are configured, they are rendered as Nunjucks templates with the
 * element as context, the edited entity as `entity` and the variables of the `context` prop, the
 * element winning over them, allowing the field to consume any
 * paginated entity endpoint. Otherwise the element is used as-is, its numeric value read as a string.
 * @param element - The element fetched from the backend.
 * @returns The dropdown option.
 */
function toOption(element: DynamicListElement): DynamicListElement {
  const { optionLabel, optionValue, optionDisabled } =
    props.definition.inputSettings ?? {};

  if (!optionLabel && !optionValue && !optionDisabled) {
    return { ...element, value: toOptionValue(element.value) as string };
  }

  // The element wins over `entity` and the context: an element carrying an `entity` property keeps
  // its own.
  const context = { ...renderContext.value, ...element };
  const option: DynamicListElement = {
    label: optionLabel ? renderString(optionLabel, context) : element.label,
    value: optionValue
      ? renderOptionValue(optionValue, context)
      : (toOptionValue(element.value) as string),
  };

  if (optionDisabled) {
    // A template renders to a string: only the literal `true` disables, anything else keeps the
    // option selectable. The preset options are exempt, so they can always be picked again.
    option.disable =
      !toValueList(presetValue).includes(option.value) &&
      renderString(optionDisabled, context).trim() === 'true';
  }

  return option;
}

/**
 * Ensures every selected value is represented in the options list.
 * For each value not found among loaded options, a placeholder entry is
 * prepended so that q-select can display the value instead of showing
 * an empty or raw string.
 */
function ensurePresetValueInOptions() {
  for (const value of toValueList(localValue.value)) {
    const found = allOptions.value.some((option) => option.value === value);
    if (!found) {
      allOptions.value.unshift({ label: String(value), value: String(value) });
    }
  }
}

/**
 * Removes the placeholder entries once their real options have been loaded.
 * A placeholder is identified as a duplicate entry where label equals value.
 */
function removePlaceholderIfResolved() {
  for (const value of toValueList(localValue.value)) {
    const matchingEntries = allOptions.value.filter(
      (option) => option.value === value
    );
    if (matchingEntries.length > 1) {
      const placeholderIndex = allOptions.value.findIndex(
        (option) => option.value === value && option.label === String(value)
      );
      if (placeholderIndex !== -1) {
        allOptions.value.splice(placeholderIndex, 1);
      }
    }
  }
}

/**
 * Triggered when the virtual scroll reaches the end of the loaded options.
 * Loads the next page if more data is available.
 * @param payload - The virtual scroll event payload.
 */
function onVirtualScroll(payload: VirtualScrollPayload) {
  const lastIndex = allOptions.value.length - 1;
  if (payload.to < lastIndex) {
    return;
  }
  fetchPage();
}

/**
 * Emits an 'update:entity' event with the updated entity object when the selection changes, each
 * numeric value being emitted as a number.
 */
function updateValue() {
  emits(
    'update:entity',
    setNestedValue(
      props.entity,
      props.definition.name,
      toEntityValue(localValue.value)
    )
  );
}
</script>

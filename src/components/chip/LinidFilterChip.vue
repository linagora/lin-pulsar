<!--
  Copyright (C) 2026 Linagora

  This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General
  Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option)
  any later version, provided you comply with the Additional Terms applicable for LinID Identity Manager software by
  LINAGORA pursuant to Section 7 of the GNU Affero General Public License, subsections (b), (c), and (e), pursuant to
  which these Appropriate Legal Notices must notably (i) retain the display of the "LinID™" trademark/logo at the top
  of the interface window, the display of the “You are using the Open Source and free version of LinID™, powered by
  Linagora © 2009–2013. Contribute to LinID R&D by subscribing to an Enterprise offer!” infobox and in the e-mails
  sent with the Program, notice appended to any type of outbound messages (e.g. e-mail and meeting requests) as well
  as in the LinID Identity Manager user interface, (ii) retain all hypertext links between LinID Identity Manager
  and https://linid.org/, as well as between LINAGORA and LINAGORA.com, and (iii) refrain from infringing LINAGORA
  intellectual property rights over its trademarks and commercial brands. Other Additional Terms apply, see
  <http://www.linagora.com/licenses/> for more details.

  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
  warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
  details.

  You should have received a copy of the GNU Affero General Public License and its applicable Additional Terms for
  LinID Identity Manager along with this program. If not, see <http://www.gnu.org/licenses/> for the GNU Affero
  General Public License version 3 and <http://www.linagora.com/licenses/> for the Additional Terms applicable to the
  LinID Identity Manager software.
-->

<template>
  <q-chip
    removable
    v-bind="uiProps.chip"
    :class="['linid-filter-chip', `linid-filter-chip--${filter.name}`]"
    :data-cy="`linid-filter-chip_${filter.name}`"
    @remove="emits('remove', filter.id)"
  >
    <q-avatar
      v-bind="uiProps.avatar"
      class="q-px-md linid-filter-chip--avatar"
    >
      {{ translateOrDefault(filter.name, 'type') }}
    </q-avatar>
    <template
      v-for="(value, index) in values"
      :key="`value_${index}`"
    >
      <em
        v-if="index > 0"
        class="q-mx-sm linid-filter-chip--separator"
      >
        {{ t('separator') }}
      </em>
      <q-spinner
        v-if="loading && !value.item"
        v-bind="uiProps.spinner"
        class="linid-filter-chip--loading"
        data-cy="linid-filter-chip_loading"
      />
      <span
        v-else
        class="linid-filter-chip--value"
      >
        {{ toLabel(value) }}
      </span>
    </template>
  </q-chip>
</template>

<script setup lang="ts">
import type {
  LinidFilterChipOutputs,
  LinidFilterChipProps,
} from '../../types/linidFilterChip';
import type {
  LinPulsarFilterDynamicLabelOptions,
  LinPulsarFilterValue,
  LinPulsarQAvatarProps,
  LinPulsarQChipProps,
  LinPulsarQSpinnerProps,
} from '@linagora/lin-pulsar-core';
import {
  getHttpClient,
  getNestedValue,
  useNunjucks,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import { onMounted, ref } from 'vue';

/** Status returned by the API when the response only holds a part of the matching items. */
const PARTIAL_CONTENT = 206;

const props = defineProps<LinidFilterChipProps>();
const emits = defineEmits<LinidFilterChipOutputs>();

const { t, te, translateOrDefault } = useScopedI18n(
  `${props.i18nScope}.LinPulsarFilterChip.${props.filter.name}`
);
const { ui } = useUiDesign();
const { renderString } = useNunjucks();

const localUiNamespace = `${props.uiNamespace}.linid-filter-chip.${props.filter.name}`;

const uiProps = {
  avatar: ui<LinPulsarQAvatarProps>(localUiNamespace, 'q-avatar'),
  chip: ui<LinPulsarQChipProps>(localUiNamespace, 'q-chip'),
  spinner: ui<LinPulsarQSpinnerProps>(localUiNamespace, 'q-spinner'),
};

/**
 * Values of the filter, wrapped in a ref so that the items resolved asynchronously are written
 * back to the original `LinPulsarFilterValue` instances and re-render the chip.
 */
const values = ref<LinPulsarFilterValue[]>(props.filter.values);
const loading = ref(false);

/**
 * Builds the text displayed for a filter value.
 *
 * The resolved item is passed as the named parameters of the `value` translation key, so a message
 * such as `{name}` displays the `name` of the item. Only the top-level fields of the item can be
 * displayed: vue-i18n rejects dotted paths in a placeholder.
 * @param value - The filter value to display.
 * @returns The translated label, or the raw value when there is no item or no `value` key.
 */
function toLabel(value: LinPulsarFilterValue): string {
  if (!value.item || !te('value')) {
    return value.value;
  }

  return t('value', value.item);
}

/**
 * Percent-encodes the query string of a rendered URL.
 *
 * The values reach the template already percent-encoded, so this only has to take care of the
 * characters written in the template itself — the `|` OR separator joining the values first of
 * all — which servers reject when they travel raw in a query string.
 * @param url - The URL rendered from the configured template.
 * @returns The same URL, with its query string encoded.
 */
function encodeQueryString(url: string): string {
  const separatorIndex = url.indexOf('?');

  if (separatorIndex < 0) {
    return url;
  }

  const query = new URLSearchParams(url.slice(separatorIndex + 1));

  return `${url.slice(0, separatorIndex)}?${query.toString()}`;
}

/**
 * Extracts the items of a response body.
 * @param data - The response body.
 * @param path - Dot-notation path to the collection, when it is not the body itself.
 * @returns The items, or an empty array when the path resolves to anything else.
 */
function toItems(
  data: Record<string, unknown>,
  path?: string
): Record<string, unknown>[] {
  const items = path ? getNestedValue(data, path) : data;

  return Array.isArray(items) ? items : [];
}

/**
 * Assigns each returned item to every still unresolved value it matches, so duplicated values are
 * all resolved by the same item.
 * @param items - Items returned by the API.
 * @param valuePath - Dot-notation path, within an item, to the attribute matching the value.
 * @returns The number of values that received an item.
 */
function assignItems(
  items: Record<string, unknown>[],
  valuePath: string
): number {
  let assigned = 0;

  items.forEach((item) => {
    values.value
      .filter(
        (value) =>
          !value.item && String(getNestedValue(item, valuePath)) === value.value
      )
      .forEach((value) => {
        value.item = item;
        assigned += 1;
      });
  });

  return assigned;
}

/**
 * Resolves every unresolved value with a single request, following the next pages while values are
 * still missing an item.
 *
 * The API answers `206 Partial Content` whenever the collection spans several pages, including on
 * the last one, so the status alone cannot drive the loop: it stops on the page marked `last`,
 * and on any page that resolves no value — matching items only get rarer on the next pages.
 * @param options - Dynamic label configuration of the filter.
 * @returns A promise resolved once the items that could be retrieved have been assigned.
 */
async function resolveInOneRequest(
  options: LinPulsarFilterDynamicLabelOptions
): Promise<void> {
  if (!options.valuePath) {
    return;
  }

  const unresolved = values.value.filter((value) => !value.item);
  const url = encodeQueryString(
    renderString(options.url, {
      values: unresolved.map((value) => encodeURIComponent(value.value)),
    })
  );
  const size = unresolved.length;
  let page = 0;
  let hasNextPage = true;

  while (hasNextPage && values.value.some((value) => !value.item)) {
    const response = await getHttpClient().get<Record<string, unknown>>(url, {
      params: { page, size },
    });
    const items = toItems(response.data, options.responseItemsPath);
    const assigned = assignItems(items, options.valuePath);

    hasNextPage =
      response.status === PARTIAL_CONTENT &&
      assigned > 0 &&
      response.data.last !== true;
    page += 1;
  }
}

/**
 * Resolves each unresolved value with its own request, the whole response being the item.
 * @param options - Dynamic label configuration of the filter.
 * @returns A promise resolved once every request has settled.
 */
async function resolveOneRequestPerValue(
  options: LinPulsarFilterDynamicLabelOptions
): Promise<void> {
  await Promise.allSettled(
    values.value
      .filter((value) => !value.item)
      .map(async (value) => {
        const response = await getHttpClient().get<Record<string, unknown>>(
          encodeQueryString(
            renderString(options.url, {
              value: encodeURIComponent(value.value),
            })
          )
        );

        value.item = response.data;
      })
  );
}

/**
 * Resolves the items missing from the filter values, as described by `dynamicLabelOptions`.
 *
 * Does nothing when the filter carries no such configuration or when every value already has an
 * item. Values that could not be resolved keep falling back to their raw value.
 * @returns A promise resolved once the resolution is over.
 */
async function resolveItems(): Promise<void> {
  const options = props.filter.dynamicLabelOptions;

  if (!options || !values.value.some((value) => !value.item)) {
    return;
  }

  loading.value = true;

  try {
    await (options.multipleRequests
      ? resolveOneRequestPerValue(options)
      : resolveInOneRequest(options));
  } catch {
    // Unresolved values fall back to their raw value, so a failed request is not worth reporting.
  } finally {
    loading.value = false;
  }
}

onMounted(resolveItems);
</script>

<style scoped lang="scss">
em {
  font-style: italic;
  color: #888;
}
.q-avatar {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  width: auto;
}

// A chip holds as many values as the user selected, so it must never grow wider than the field
// it is rendered in: its content wraps instead, and the chip grows in height.
.linid-filter-chip {
  max-width: 100%;
  height: auto;
  min-height: 2em;
  // Quasar centers a single line in a fixed 2em box, where its vertical padding is absorbed. Once
  // the height follows the content, that padding adds up instead: each line carries the 2em itself.
  padding-block: 0;
  line-height: 2;

  :deep(.q-chip__content) {
    flex-wrap: wrap;
    white-space: normal;
    // An unresolved value is displayed raw, and an identifier has no space to wrap on.
    overflow-wrap: anywhere;
  }
}
</style>

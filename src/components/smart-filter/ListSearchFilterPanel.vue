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
  <div class="list-search-filter-panel">
    <q-list
      v-bind="uiProps.list"
      class="list-search-filter-panel--list"
    >
      <q-item
        v-for="item in props.items"
        :key="item.value"
        v-bind="uiProps.item"
      >
        <q-item-section v-bind="uiProps.itemSectionCheckbox">
          <q-checkbox
            v-model="tickedItems"
            :val="item.value"
          />
        </q-item-section>

        <q-item-section v-bind="uiProps.itemSectionLabel">
          {{ item.label }}
        </q-item-section>
      </q-item>
    </q-list>

    <q-btn
      v-bind="uiProps.filterButton"
      :label="t('searchButton')"
      data-cy="list-search-filter-panel_search"
      class="q-mt-sm float-right list-search-filter-panel_search"
      @click="onSearch"
    />
  </div>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type {
  LinPulsarQBtnProps,
  LinPulsarQListProps,
  LinPulsarQItemProps,
  LinPulsarQItemSectionProps,
} from '@linagora/lin-pulsar-core';
import {
  LinPulsarFilterValue,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import type { ListSearchFilterProps } from '../../types/ListSearchFilterPanel';
import { ref } from 'vue';
import type { LinPulsarFilterPanelSearchOutputs } from '../../types/linPulsarFilterPanel';

const props = defineProps<ListSearchFilterProps>();
const emit = defineEmits<LinPulsarFilterPanelSearchOutputs>();

const { ui } = useUiDesign();
const localI18n = `${props.i18nScope}.ListSearchFilterPanel`;
const { t } = useScopedI18n(localI18n);
const localUiNamespace = `${props.uiNamespace}.list-search-filter-panel`;

const tickedItems = ref<string[]>([]);

const uiProps = {
  list: ui<LinPulsarQListProps>(localUiNamespace, 'q-list'),
  item: ui<LinPulsarQItemProps>(localUiNamespace, 'q-item'),
  itemSectionCheckbox: ui<LinPulsarQItemSectionProps>(
    `${localUiNamespace}.checkboxSection`,
    'q-item-section'
  ),
  itemSectionLabel: ui<LinPulsarQItemSectionProps>(
    `${localUiNamespace}.labelSection`,
    'q-item-section'
  ),
  filterButton: ui<LinPulsarQBtnProps>(localUiNamespace, 'q-btn'),
};

/**
 * Emits a 'search' event with the ticked nodes.
 */
function onSearch() {
  const result: LinPulsarFilterValue[] = tickedItems.value.map((item) => {
    return new LinPulsarFilterValue(false, '', item);
  });
  emit('search', {
    field: props.fieldName,
    values: result,
  });
}
</script>

<style scoped>
.list-search-filter-panel .list-search-filter-panel--list {
  max-height: 13rem;
  overflow-y: auto;
}
</style>

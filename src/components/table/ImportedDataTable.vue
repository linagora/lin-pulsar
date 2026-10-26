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
  <!-- v8 ignore start -->
  <q-table
    :columns="columns"
    :rows="rows"
    :loading="isLoading"
    v-bind="uiProps.table"
    class="imported-data-table"
    :rows-per-page-label="translateOrDefault('', 'rowsPerPage')"
    :no-data-label="t('noData')"
    :rows-per-page-options="[5, 7, 10, 15, 20, 25, 50]"
    :pagination-label="
      (firstRowIndex, endRowIndex, totalRowsNumber) =>
        translateOrDefault('', 'paginationLabel', {
          start: firstRowIndex,
          end: endRowIndex,
          total: totalRowsNumber,
        })
    "
  >
    <template #body="opt">
      <q-tr
        :props="opt"
        :class="opt.row.__rowClass"
        data-cy="file-row"
      >
        <template v-for="col in opt.cols">
          <q-td
            v-if="col.name === '__error'"
            :key="col.name"
            :props="opt"
            auto-width
            :data-cy="`cell-${col.name}_${opt.row.__id}`"
          >
            <q-btn
              v-if="opt.row.__error && !opt.row.__expand"
              :label="translateOrDefault('', 'expandButtonOpen')"
              v-bind="uiProps.expandBtnOpen"
              @click="opt.row.__expand = true"
            />
            <q-btn
              v-else-if="opt.row.__error"
              :label="translateOrDefault('', 'expandButtonClose')"
              v-bind="uiProps.expandBtnClose"
              @click="opt.row.__expand = false"
            />
          </q-td>
          <q-td
            v-else-if="col.name === '__delete'"
            :key="col.name"
            :props="opt"
            auto-width
            :data-cy="`cell-${col.name}_${opt.row.__id}`"
          >
            <q-btn
              v-bind="uiProps.deleteBtn"
              :label="translateOrDefault('', 'deleteButton')"
              :data-cy="`button_delete_${opt.row.__id}`"
              @click="emit('delete:item', opt.row.__id)"
            />
          </q-td>
          <q-td
            v-else-if="col.name === '__status'"
            :key="col.name"
            :props="opt"
            auto-width
            :data-cy="`cell-${col.name}_${opt.row.__id}`"
          >
            <q-badge v-bind="uiProps.badge[opt.row.__status as ImportStatus]">
              <q-spinner
                v-if="opt.row.__status === 'IMPORTING'"
                class="q-mr-sm"
                v-bind="uiProps.spinner"
              />
              {{
                translateOrDefault(
                  opt.row.__status,
                  `status.${opt.row.__status}`
                )
              }}
            </q-badge>
          </q-td>
          <q-td
            v-else
            :key="col.name"
            :props="opt"
            :data-cy="`cell-${col.name}_${opt.row.__id}`"
          >
            {{ opt.row[col.field] }}
          </q-td>
        </template>
      </q-tr>

      <q-tr
        v-show="opt.row.__expand"
        :props="opt"
      >
        <q-td colspan="100%">
          <div class="text-left imported-data-table--error-content">
            {{ opt.row.__error }}
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import {
  type LinPulsarQBadgeProps,
  type LinPulsarQBtnProps,
  type LinPulsarQSpinnerProps,
  type LinPulsarQTableProps,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import type { QTableColumn } from 'quasar';
import { computed, type ComputedRef } from 'vue';
import type {
  ImportedDataTableOutputs,
  ImportedDataTableProps,
  ImportStatus,
} from '../../types/importedDataTable';

const props = withDefaults(defineProps<ImportedDataTableProps>(), {
  isLoading: false,
});
const emit = defineEmits<ImportedDataTableOutputs>();

const localUiNamespace = `${props.uiNamespace}.imported-data-table`;
const { t, translateOrDefault } = useScopedI18n(
  `${props.i18nScope}.ImportedDataTable`
);
const { ui } = useUiDesign();

const uiProps = {
  table: ui<LinPulsarQTableProps>(localUiNamespace, 'q-table'),
  expandBtnOpen: ui<LinPulsarQBtnProps>(
    `${localUiNamespace}.expand-button-open`,
    'q-btn'
  ),
  expandBtnClose: ui<LinPulsarQBtnProps>(
    `${localUiNamespace}.expand-button-close`,
    'q-btn'
  ),
  deleteBtn: ui<LinPulsarQBtnProps>(
    `${localUiNamespace}.delete-button`,
    'q-btn'
  ),
  spinner: ui<LinPulsarQSpinnerProps>(localUiNamespace, 'q-spinner'),
  badge: {
    READY: ui<LinPulsarQBadgeProps>(`${localUiNamespace}.READY`, 'q-badge'),
    IMPORTING: ui<LinPulsarQBadgeProps>(
      `${localUiNamespace}.IMPORTING`,
      'q-badge'
    ),
    IMPORTED: ui<LinPulsarQBadgeProps>(
      `${localUiNamespace}.IMPORTED`,
      'q-badge'
    ),
    ERROR: ui<LinPulsarQBadgeProps>(`${localUiNamespace}.ERROR`, 'q-badge'),
  } satisfies Record<ImportStatus, LinPulsarQBadgeProps>,
};

const columns: ComputedRef<QTableColumn[]> = computed(() => [
  {
    field: '__error',
    name: '__error',
    label: translateOrDefault('', 'headers.__error'),
    sortable: false,
    align: 'left' as const,
  },
  {
    field: '__id',
    name: '__delete',
    label: translateOrDefault('', 'headers.__delete'),
    sortable: false,
    align: 'left' as const,
  },
  {
    field: '__file',
    name: '__file',
    label: translateOrDefault('', 'headers.__file'),
    sortable: true,
    align: 'left' as const,
  },
  {
    field: '__status',
    name: '__status',
    label: translateOrDefault('', 'headers.__status'),
    sortable: true,
    align: 'left' as const,
  },
  ...props.fields.map((field) => ({
    field,
    name: field,
    label: translateOrDefault(field, `headers.${field}`),
    sortable: true,
    align: 'left' as const,
  })),
]);
</script>

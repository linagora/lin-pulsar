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
  <q-table
    class="full-width generic-entity-table"
    data-cy="generic-entity-table"
    :columns="columns"
    :rows="props.rows"
    :row-key="props.rowKey"
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
    v-bind="uiProps"
  >
    <template
      v-for="name in forwardedSlotNames"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps"
      />
    </template>

    <template
      v-for="name in zoneColumnNames"
      :key="name"
      #[`body-cell-${name}`]="cellProps"
    >
      <q-td
        :props="cellProps"
        :data-cy="`entity-cell-${name}_${cellProps.key}`"
      >
        <LinidZoneRenderer
          v-for="(item, index) in cellEntities.get(cellProps.key)?.[name] ?? []"
          :key="index"
          :zone="columnZone(name)"
          :entity="item"
          :ui-namespace="props.uiNamespace"
          :i18n-scope="props.i18nScope"
        />
      </q-td>
    </template>

    <template
      v-if="hasActionScope && !$slots.body"
      #body="bodyProps"
    >
      <q-tr
        :props="bodyProps"
        data-cy="entity-row"
      >
        <q-td
          v-for="col in bodyProps.cols"
          :key="col.name"
          :props="bodyProps"
          :data-cy="`entity-cell-${col.name}_${bodyProps.key}`"
        >
          <template v-if="col.name === ACTIONS_COLUMN_NAME">
            <div
              class="flex justify-end q-gutter-x-sm generic-entity-table--actions"
              :data-cy="`entity-actions_${bodyProps.key}`"
            >
              <slot
                name="actions"
                :row="bodyProps.row"
                :row-key="bodyProps.key"
              />
            </div>
          </template>

          <template v-else-if="zoneColumnNames.includes(col.name)">
            <LinidZoneRenderer
              v-for="(item, index) in cellEntities.get(bodyProps.key)?.[
                col.name
              ] ?? []"
              :key="index"
              :zone="columnZone(col.name)"
              :entity="item"
              :ui-namespace="props.uiNamespace"
              :i18n-scope="props.i18nScope"
            />
          </template>

          <template v-else>
            {{ col.value }}
          </template>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import {
  getNestedValue,
  type LinidQTableProps,
  LinidZoneRenderer,
  useScopedI18n,
  useUiDesign,
  useValueFormatter,
} from '@linagora/linid-im-front-corelib';
import { computed, useSlots } from 'vue';
import { useColumnZones } from '../../composables/useColumnZones';
import type { GenericEntityTableProps } from '../../types/genericEntityTable';

const ACTION_SCOPE_NAME = 'actions';

/** Name of the column hosting the actions scope. */
const ACTIONS_COLUMN_NAME = 'table_actions';

const props = withDefaults(defineProps<GenericEntityTableProps>(), {
  rowKey: 'id',
});

const { t, translateOrDefault } = useScopedI18n(
  `${props.i18nScope}.GenericEntityTable`
);

const { ui } = useUiDesign();
const { formatValue } = useValueFormatter();
const slots = useSlots();
const { columnZone, hasColumnZone, columnEntities } = useColumnZones(
  () => props.uiNamespace
);

/**
 * Names of the columns rendered through a registered column zone. Parent
 * rendering takes precedence: a column whose `body-cell-*` slot is provided
 * keeps the parent rendering, and the actions column keeps the actions scope
 * when it is provided.
 */
const zoneColumnNames = computed(() =>
  props.columns
    .map((column) => column.name)
    .filter(
      (name) =>
        !slots[`body-cell-${name}`] &&
        !(name === ACTIONS_COLUMN_NAME && slots[ACTION_SCOPE_NAME]) &&
        hasColumnZone(name)
    )
);

/**
 * Resolves the key of a row, as QTable does with the `rowKey` prop.
 * @param row - The row entity.
 * @returns The row key value.
 */
const resolveRowKey = (row: Record<string, unknown>) =>
  typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey];

/**
 * Entities rendered by the column zones, keyed by row key then by column
 * name. A single-item column renders the row itself; a multi-item column
 * renders each item of the array resolved from `itemPath` against
 * `{ entity: row }`, and a value that is not an array renders nothing.
 */
const cellEntities = computed(() => {
  const entitiesByRow = new Map<unknown, Record<string, unknown[]>>();
  const zoneNames = new Set(zoneColumnNames.value);

  for (const row of props.rows) {
    const entitiesByColumn: Record<string, unknown[]> = {};

    for (const column of props.columns) {
      if (!zoneNames.has(column.name)) {
        continue;
      }

      entitiesByColumn[column.name] = columnEntities(column, row);
    }

    entitiesByRow.set(resolveRowKey(row), entitiesByColumn);
  }

  return entitiesByRow;
});

const uiProps = ui<LinidQTableProps>(
  `${props.uiNamespace}.generic-entity-table`,
  'q-table'
);

const forwardedSlotNames = computed(() =>
  Object.keys(slots).filter((name) => name !== ACTION_SCOPE_NAME)
);

/**
 * Adds Quasar column formatters and nested attribute resolution without
 * mutating rows.
 */
const columns = computed(() =>
  props.columns.map((column) => {
    const field =
      typeof column.field === 'string' && column.field.includes('.')
        ? (row: Record<string, unknown>) =>
            getNestedValue(row, column.field as string)
        : column.field;

    if (!column.formatter) {
      return { ...column, field };
    }

    return {
      ...column,
      field,
      format: (value: unknown) =>
        formatValue(value, column.formatter, column.formatOptions),
    };
  })
);

const hasActionScope = computed(() => Boolean(slots[ACTION_SCOPE_NAME]));
</script>

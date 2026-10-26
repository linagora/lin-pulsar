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
  <q-page
    data-cy="generics-table-page"
    class="q-pa-md flex column items-center generics-table-page"
  >
    <LinPulsarZoneRenderer
      :zone="`${instanceId}.header.before`"
      :instance-id="instanceId"
      :ui-namespace="uiNamespace"
      :i18n-scope="i18nScope"
    />

    <div class="row items-center generics-table-page--header">
      <LinPulsarZoneRenderer
        :zone="`${instanceId}.header.prefix`"
        :instance-id="instanceId"
        :ui-namespace="uiNamespace"
        :i18n-scope="i18nScope"
      />
      <h1
        v-if="te('title')"
        class="generics-table-page--title"
        data-cy="generics-table-page-title"
      >
        {{ t('title') }}
      </h1>
      <LinPulsarZoneRenderer
        :zone="`${instanceId}.header.suffix`"
        :instance-id="instanceId"
        :ui-namespace="uiNamespace"
        :i18n-scope="i18nScope"
      />
    </div>

    <div class="row relative-position justify-center full-width q-mb-md">
      <LinPulsarSmartFilter
        v-if="options.filters?.length"
        :filters="filters"
        :options="{ filters: options.filters, filterSets: favorites }"
        :ui-namespace="uiNamespace"
        :i18n-scope="i18nScope"
        @update:filters="onFiltersChange"
        @apply:favorite="onFavoriteApply"
        @rename:favorite="openRenameFavoriteDialog"
        @delete:favorite="openDeleteFavoriteDialog"
        @override:favorite="openOverrideFavoriteDialog"
        @create:favorite="openCreateFavoriteDialog"
      />
      <ButtonsCard
        v-if="options.enableActions"
        class="absolute-right generics-table-page--actions"
        :ui-namespace="uiNamespace"
        :i18n-scope="i18nScope"
        :show-confirm-button="false"
        :show-cancel-button="false"
      >
        <template #append-buttons>
          <LinPulsarZoneRenderer
            :zone="`${instanceId}.header.actions`"
            :ui-namespace="`${uiNamespace}.buttons-card`"
            :i18n-scope="`${i18nScope}.ButtonsCard`"
            :instance-id="instanceId"
          />
          <q-btn
            v-bind="uiProps.createButton"
            :label="t('ButtonsCard.create')"
            class="buttons-card--create-button"
            data-cy="button_create"
            :to="options.creationPagePath"
          />
        </template>
      </ButtonsCard>
    </div>
    <LinPulsarZoneRenderer
      :zone="`${instanceId}.header.after`"
      :instance-id="instanceId"
      :ui-namespace="uiNamespace"
      :i18n-scope="i18nScope"
    />

    <LinPulsarZoneRenderer
      :zone="`${instanceId}.content.before`"
      :instance-id="instanceId"
      :ui-namespace="uiNamespace"
      :i18n-scope="i18nScope"
      :is-loading="isLoading"
    />

    <GenericEntityTable
      v-model:pagination="pagination"
      :ui-namespace="uiNamespace"
      :i18n-scope="i18nScope"
      :rows="items"
      :columns="columns"
      :loading="isLoading"
      :row-key="options.idKey"
      @request="onRequest"
    >
      <template #body="props">
        <q-tr
          :props="props"
          data-cy="item-row"
        >
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            :data-cy="`cell-${col.name}_${props.row[options.idKey]}`"
          >
            <template v-if="col.name === 'table_actions'">
              <div class="flex justify-end q-gutter-x-sm">
                <LinPulsarZoneRenderer
                  :zone="`${instanceId}.row-actions`"
                  :entity="props.row"
                  :row="props.row"
                  :row-key="props.row[options.idKey]"
                  :instance-id="instanceId"
                  :ui-namespace="uiNamespace"
                  :i18n-scope="i18nScope"
                />
                <q-btn
                  v-if="options.enableSeeButton !== false"
                  :label="t('seeButton')"
                  :data-cy="`see-button_${props.row[options.idKey]}`"
                  v-bind="uiProps.seeButton"
                  :to="detailPagePaths.get(props.row[options.idKey])"
                />
              </div>
            </template>
            <template v-else-if="hasColumnZone(col.name)">
              <LinPulsarZoneRenderer
                v-for="(item, index) in columnEntities(col, props.row)"
                :key="index"
                :zone="columnZone(col.name)"
                :entity="item"
                :instance-id="instanceId"
                :ui-namespace="uiNamespace"
                :i18n-scope="i18nScope"
              />
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </GenericEntityTable>
    <LinPulsarZoneRenderer
      :zone="`${instanceId}.content.after`"
      :instance-id="instanceId"
      :ui-namespace="uiNamespace"
      :i18n-scope="i18nScope"
      :is-loading="isLoading"
    />
  </q-page>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type {
  LinPulsarFilter,
  LinPulsarFilterSetUserPreference,
  LinPulsarQBtnProps,
  QTableRequestEvent,
  QuasarPagination,
  QueryFilter,
  UiEvent,
} from '@linagora/lin-pulsar-core';
import {
  getEntities,
  getModuleHostConfiguration,
  LinPulsarFilterSet,
  LinPulsarZoneRenderer,
  uiEventSubject,
  useLinPulsarFilterUrl,
  useLinPulsarUserPreference,
  useNotify,
  usePagination,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import type { Subscription } from 'rxjs';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ButtonsCard from '../components/card/ButtonsCard.vue';
import LinPulsarSmartFilter from '../components/smart-filter/LinPulsarSmartFilter.vue';
import GenericEntityTable from '../components/table/GenericEntityTable.vue';
import { useColumnZones } from '../composables/useColumnZones';
import type {
  GenericTableColumn,
  ModuleGenericTablePageOptions,
} from '../types/ModuleGenericTablePageOptions';

const router = useRouter();
const route = useRoute();
const instanceId = computed<string>(() => route.meta.instanceId as string);
const parentPath = computed(() => route.matched[0]?.path);
const i18nScope = computed<string>(() => `${instanceId.value}`);
const uiNamespace = computed(() => `${instanceId.value}`);
const options = computed(
  () =>
    getModuleHostConfiguration<ModuleGenericTablePageOptions>(instanceId.value)!
      .options
);

const { t, te } = useScopedI18n(i18nScope.value);
const { userPreferenceStore, deleteUserPreference, saveUserPreference } =
  useLinPulsarUserPreference();
const items = ref<Record<string, unknown>[]>([]);
const isLoading = ref<boolean>(false);
let eventSubscription: Subscription;
const { Notify } = useNotify();
const { setFiltersInUrl, getFiltersFromUrl } = useLinPulsarFilterUrl(
  router,
  route
);
const filters = ref<LinPulsarFilter[]>(
  getFiltersFromUrl(options.value.filters ?? [])
);
const favoritesBaseConfigurationKey = computed(
  () => `ui.${instanceId.value}.favorites.`
);
const favorites = computed<LinPulsarFilterSet[]>(() =>
  Object.keys(userPreferenceStore.userPreferences)
    .filter((key) => key.indexOf(favoritesBaseConfigurationKey.value) === 0)
    .map((key) => parseFavorite(userPreferenceStore.userPreferences[key]))
    .filter((data) => data !== null)
    .map((data) =>
      LinPulsarFilterSet.fromString(
        data.id,
        data.label,
        data.value,
        options.value.filters ?? []
      )
    )
);

const { toPagination, toQuasarPagination } = usePagination();
const pagination = ref<QuasarPagination>({
  page: 1,
  rowsNumber: 0,
  sortBy: null,
  rowsPerPage: 10,
  descending: true,
});
const columns = computed<GenericTableColumn[]>(() =>
  options.value.columns.map((column) => ({
    ...column,
    label: t(column.label),
  }))
);

const { columnZone, hasColumnZone, columnEntities } = useColumnZones(
  () => uiNamespace.value
);
const { ui } = useUiDesign();
const uiProps = computed(() => ({
  seeButton: ui<LinPulsarQBtnProps>(`${uiNamespace.value}.see-button`, 'q-btn'),
  createButton: ui<LinPulsarQBtnProps>(
    `${uiNamespace.value}.buttons-card.create-button`,
    'q-btn'
  ),
}));

/**
 * Detail page path of each loaded item, relative to the parent route and keyed by the item
 * identifier read from `options.idKey`. Bound to the see button link of each row so that the router
 * handles a click while the browser keeps its link controls, such as opening the route in a new tab.
 */
const detailPagePaths = computed(
  () =>
    new Map(
      items.value.map((item) => [
        item[options.value.idKey],
        `${parentPath.value}/${item[options.value.idKey] as string}`,
      ])
    )
);

/**
 * Updates pagination state when the table page or rows-per-page change
 * and reloads the items data accordingly.
 * @param props - Event object containing the new pagination info.
 * @returns A promise that resolves when the data has been loaded and the loading state has been updated.
 */
async function onRequest(props: QTableRequestEvent) {
  pagination.value = props.pagination;
  return loadData();
}

/**
 * Handles filter changes emitted by the smart filter. Resets pagination to
 * the first page, reflects the new filters in the URL, and reloads data.
 * @param newFilters - The updated list of active filters.
 * @returns A promise that resolves when the data has been loaded.
 */
function onFiltersChange(newFilters: LinPulsarFilter[]): Promise<void> {
  filters.value = newFilters;
  pagination.value.page = 1;
  setFiltersInUrl(newFilters, options.value.keepQueryParams ?? []);
  return loadData();
}

/**
 * Converts the active filters into a query filter object, ready to be sent
 * to the entities API.
 * @returns A query filter built from the active filters.
 */
function toQueryFilter(): QueryFilter {
  return {
    ...Object.fromEntries(
      filters.value.map((filter) => [filter.name, filter.toString()])
    ),
    dateFormat: 'yyyy/MM/dd HH:mm:ss',
  };
}

/**
 * Applies a saved favorite filter set by forwarding its filters to the global filter change handler.
 * @param favorite - The selected filter set to apply.
 */
function onFavoriteApply(favorite: LinPulsarFilterSet) {
  onFiltersChange(favorite.filters);
}

/**
 * Opens a confirmation dialog to delete a saved favorite filter set.
 *
 * If the user confirms the action, the corresponding favorite is removed from
 * the user preferences store using its identifier.
 * @param favorite - The favorite filter set to delete.
 */
function openDeleteFavoriteDialog(favorite: LinPulsarFilterSet): void {
  uiEventSubject.next({
    key: 'confirmation',
    data: {
      type: 'open',
      title: t('DeleteFavoriteDialog.title'),
      content: t('DeleteFavoriteDialog.content', {
        label: favorite.label,
      }),
      uiNamespace: `${uiNamespace.value}.delete-favorite-dialog`,
      i18nScope: `${i18nScope.value}.DeleteFavoriteDialog`,
      onConfirm: () => {
        deleteUserPreference(
          `${favoritesBaseConfigurationKey.value}${favorite.id}`
        );
        Notify({
          type: 'positive',
          message: t('RemoveFavoriteNotifyMessage', { name: favorite.label }),
        });
      },
    },
  });
}

/**
 * Opens a form dialog to rename a favorite filter set.
 * @param favorite - The favorite filter set to rename.
 */
function openRenameFavoriteDialog(favorite: LinPulsarFilterSet): void {
  uiEventSubject.next({
    key: 'form',
    data: {
      type: 'open',
      title: t('RenameFavoriteDialog.title'),
      content: t('RenameFavoriteDialog.content'),
      uiNamespace: `${uiNamespace.value}.rename-favorite-dialog`,
      i18nScope: `${i18nScope.value}.RenameFavoriteDialog`,
      formFields: [
        {
          name: 'favoriteName',
          type: 'String',
          input: 'Text',
          required: true,
          inputSettings: {},
        },
      ],
      // eslint-disable-next-line jsdoc/require-jsdoc
      onSubmit: (formData: { favoriteName: string }) => {
        const trimmedFavoriteName = formData.favoriteName.trim();
        if (favorites.value.some((fav) => fav.label === trimmedFavoriteName)) {
          Notify({
            type: 'negative',
            message: t('RenameFavoriteDialog.duplicateName', {
              name: trimmedFavoriteName,
            }),
          });
          return;
        }

        saveUserPreference(
          `${favoritesBaseConfigurationKey.value}${favorite.id}`,
          JSON.stringify({
            id: favorite.id,
            label: trimmedFavoriteName,
            value: new LinPulsarFilterSet(
              favorite.id,
              trimmedFavoriteName,
              filters.value
            ).toString(),
          })
        );
        Notify({
          type: 'positive',
          message: t('RenameFavoriteNotifyMessage', {
            name: trimmedFavoriteName,
          }),
        });
      },
    },
  });
}

/**
 * Opens a confirmation dialog to override an existing favorite filter set with the current filters.
 * @param favorite - The favorite filter set to override.
 */
function openOverrideFavoriteDialog(favorite: LinPulsarFilterSet): void {
  uiEventSubject.next({
    key: 'confirmation',
    data: {
      type: 'open',
      title: t('OverrideFavoriteDialog.title'),
      content: t('OverrideFavoriteDialog.content', {
        label: favorite.label,
      }),
      uiNamespace: `${uiNamespace.value}.override-favorite-dialog`,
      i18nScope: `${i18nScope.value}.OverrideFavoriteDialog`,
      onConfirm: () => {
        saveUserPreference(
          `${favoritesBaseConfigurationKey.value}${favorite.id}`,
          JSON.stringify({
            id: favorite.id,
            label: favorite.label,
            value: new LinPulsarFilterSet(
              favorite.id,
              favorite.label,
              filters.value
            ).toString(),
          })
        );
        Notify({
          type: 'positive',
          message: t('OverrideFavoriteNotifyMessage', {
            name: favorite.label,
          }),
        });
      },
    },
  });
}

/**
 * Generates a unique favorite ID by looping on crypto.randomUUID until an ID is found.
 * @returns A unique UUID string that is not already used in favorites.
 */
function generateUniqueFavoriteId(): string {
  let newId = crypto.randomUUID();
  while (favorites.value.some((fav) => fav.id === newId)) {
    newId = crypto.randomUUID();
  }
  return newId;
}

/**
 * Opens a form dialog to create a favorite filter set with the current filters.
 */
function openCreateFavoriteDialog(): void {
  uiEventSubject.next({
    key: 'form',
    data: {
      type: 'open',
      title: t('CreateFavoriteDialog.title'),
      content: t('CreateFavoriteDialog.content'),
      uiNamespace: `${uiNamespace.value}.create-favorite-dialog`,
      i18nScope: `${i18nScope.value}.CreateFavoriteDialog`,
      formFields: [
        {
          name: 'favoriteName',
          type: 'String',
          input: 'Text',
          required: true,
          inputSettings: {},
        },
      ],
      // eslint-disable-next-line jsdoc/require-jsdoc
      onSubmit: (formData: { favoriteName: string }) => {
        const trimmedFavoriteName = formData.favoriteName.trim();
        if (favorites.value.some((fav) => fav.label === trimmedFavoriteName)) {
          Notify({
            type: 'negative',
            message: t('CreateFavoriteDialog.duplicateName', {
              name: trimmedFavoriteName,
            }),
          });
          return;
        }

        const favoriteId = generateUniqueFavoriteId();
        saveUserPreference(
          `${favoritesBaseConfigurationKey.value}${favoriteId}`,
          JSON.stringify({
            id: favoriteId,
            label: trimmedFavoriteName,
            value: new LinPulsarFilterSet(
              favoriteId,
              trimmedFavoriteName,
              filters.value
            ).toString(),
          })
        );
        Notify({
          type: 'positive',
          message: t('CreateFavoriteNotifyMessage', {
            name: trimmedFavoriteName,
          }),
        });
      },
    },
  });
}

/**
 * Parses a serialized favorite filter set from a JSON string and validates its structure.
 *
 * The function expects a JSON string representing a `LinPulsarFilterSetUserPreference`-like object.
 * It performs both deserialization and structural validation, ensuring that the value is valid JSON,
 * that the result is a non-null object, that it contains `id`, `label`, and `value` properties,
 * and that all of these properties are non-empty strings after trimming whitespace.
 *
 * If the input is valid, the parsed object is returned. Otherwise, the function returns `null`.
 * @param value - JSON string representing a saved favorite filter set.
 * @returns A validated `LinPulsarFilterSetUserPreference` object, or `null` if invalid or unparsable.
 */
function parseFavorite(value: string): LinPulsarFilterSetUserPreference | null {
  let obj;
  try {
    obj = JSON.parse(value);
  } catch {
    return null;
  }

  if (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'label' in obj &&
    'value' in obj &&
    typeof obj.id === 'string' &&
    typeof obj.label === 'string' &&
    typeof obj.value === 'string' &&
    obj.id.trim().length > 0 &&
    obj.label.trim().length > 0 &&
    obj.value.trim().length > 0
  ) {
    return obj;
  }

  return null;
}

/**
 * Loads a paginated list of entities and updates the reactive items state.
 * @returns A promise that resolves when the data has been loaded and the loading state has been updated.
 */
function loadData(): Promise<void> {
  isLoading.value = true;

  return getEntities<Record<string, unknown>>(
    instanceId.value,
    toQueryFilter(),
    toPagination(pagination.value)
  )
    .then((data) => {
      items.value = data.content;
      pagination.value = toQuasarPagination(data, pagination.value);
    })
    .catch(() => {
      items.value = [];
      Notify({
        type: 'negative',
        message: t('error'),
      });
    })
    .finally(() => {
      isLoading.value = false;
    });
}

onMounted(async () => {
  eventSubscription = uiEventSubject.subscribe((event: UiEvent) => {
    if (options.value?.reloadTableOn?.includes(event.key)) {
      loadData();
    }
  });
  await loadData();
});

onUnmounted(() => {
  eventSubscription.unsubscribe();
});
</script>

<style lang="scss" scoped>
.lin-pulsar-smart-filter {
  width: 50%;
  min-width: 50%;
}
.generics-table-page--actions > :first-child {
  padding-right: 0;
}
</style>

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
  <div
    class="col-grow lin-pulsar-favorite-panel"
    data-cy="lin-pulsar-favorite-panel"
  >
    <div class="text-weight-bold q-pa-sm lin-pulsar-favorite-panel--title">
      <q-icon
        v-if="uiProps.titleIcon?.name"
        v-bind="uiProps.titleIcon"
      />
      {{ t('title') }}
    </div>

    <q-separator v-bind="uiProps.titleSeparator" />

    <div class="q-gutter-sm q-pa-sm lin-pulsar-favorite-panel--action-buttons">
      <q-btn
        v-bind="uiProps.createButton"
        :label="t('createFavorite')"
        :disable="props.filters?.length === 0"
        :data-cy="`button_create`"
        @click="emit('create')"
      />
    </div>

    <div class="row no-wrap lin-pulsar-favorite-panel--content">
      <q-list
        v-bind="uiProps.list"
        class="full-width col-auto lin-pulsar-favorite-panel--list"
        data-cy="lin-pulsar-favorite-panel_list"
      >
        <q-item
          v-for="(favorite, index) in favorites"
          :key="`fav_${index}`"
          v-bind="uiProps.item"
          clickable
          :data-cy="`lin-pulsar-favorite-panel_item-${index}`"
          @click="emit('apply', favorite)"
        >
          <q-item-section
            v-if="uiProps.icon?.name"
            v-bind="uiProps.iconSection"
            avatar
          >
            <q-icon v-bind="uiProps.icon" />
          </q-item-section>
          <q-item-section
            v-bind="uiProps.labelSection"
            :data-cy="`favorite-label_${index}`"
          >
            <slot :favorite="favorite">
              {{ favorite.label }}
            </slot>
          </q-item-section>
          <q-item-section
            v-bind="uiProps.overrideSection"
            class="row items-end"
          >
            <q-btn
              v-bind="uiProps.overrideButton"
              :label="translateOrDefault('', 'overrideButton')"
              :disable="props.filters?.length === 0"
              :data-cy="`button_override_${index}`"
              @click.stop="emit('override', favorite)"
            />
          </q-item-section>
          <q-item-section
            v-bind="uiProps.renameSection"
            class="row items-end"
          >
            <q-btn
              v-bind="uiProps.renameButton"
              :label="translateOrDefault('', 'renameButton')"
              class="delete-rename"
              :data-cy="`button_rename_${index}`"
              @click.stop="emit('rename', favorite)"
            />
          </q-item-section>
          <q-item-section
            v-bind="uiProps.deleteSection"
            class="row items-end"
          >
            <q-btn
              v-bind="uiProps.deleteButton"
              :label="translateOrDefault('', 'deleteButton')"
              class="delete-button"
              :data-cy="`button_delete_${index}`"
              @click.stop="emit('delete', favorite)"
            />
          </q-item-section>
        </q-item>

        <q-item
          v-if="favorites.length === 0"
          v-bind="uiProps.item"
        >
          <q-item-section
            v-if="uiProps.noDataIcon?.name"
            v-bind="uiProps.noDataIconSection"
            avatar
          >
            <q-icon v-bind="uiProps.noDataIcon" />
          </q-item-section>
          <q-item-section v-bind="uiProps.noDataLabelSection">
            {{ t('noData') }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type {
  LinPulsarQBtnProps,
  LinPulsarQIconProps,
  LinPulsarQItemProps,
  LinPulsarQItemSectionProps,
  LinPulsarQListProps,
  LinPulsarQSeparatorProps,
} from '@linagora/lin-pulsar-core';
import { useScopedI18n, useUiDesign } from '@linagora/lin-pulsar-core';
import { computed } from 'vue';
import type {
  LinPulsarFavoritePanelOutputs,
  LinPulsarFavoritePanelProps,
  LinPulsarFavoritePanelUIProps,
} from '../../types/linPulsarFavoritePanel';

const props = defineProps<LinPulsarFavoritePanelProps>();
const emit = defineEmits<LinPulsarFavoritePanelOutputs>();

const { t, translateOrDefault } = useScopedI18n(
  `${props.i18nScope}.LinPulsarFavoritePanel`
);
const { ui } = useUiDesign();

const localUiNamespace = `${props.uiNamespace}.lin-pulsar-favorite-panel`;
const headerUiNamespace = `${localUiNamespace}.header`;
const contentUiNamespace = `${localUiNamespace}.content`;

const uiProps = computed<LinPulsarFavoritePanelUIProps>(() => ({
  titleIcon: ui<LinPulsarQIconProps>(headerUiNamespace, 'q-icon'),
  titleSeparator: ui<LinPulsarQSeparatorProps>(
    headerUiNamespace,
    'q-separator'
  ),
  list: ui<LinPulsarQListProps>(contentUiNamespace, 'q-list'),
  item: ui<LinPulsarQItemProps>(contentUiNamespace, 'q-item'),
  iconSection: ui<LinPulsarQItemSectionProps>(
    `${contentUiNamespace}.icon-section`,
    'q-item-section'
  ),
  icon: ui<LinPulsarQIconProps>(`${contentUiNamespace}.icon-section`, 'q-icon'),
  labelSection: ui<LinPulsarQItemSectionProps>(
    `${contentUiNamespace}.label-section`,
    'q-item-section'
  ),
  noDataIconSection: ui<LinPulsarQItemSectionProps>(
    `${contentUiNamespace}.no-data-icon-section`,
    'q-item-section'
  ),
  noDataIcon: ui<LinPulsarQIconProps>(
    `${contentUiNamespace}.no-data-icon-section`,
    'q-icon'
  ),
  noDataLabelSection: ui<LinPulsarQItemSectionProps>(
    `${contentUiNamespace}.no-data-label-section`,
    'q-item-section'
  ),
  renameSection: ui<LinPulsarQItemSectionProps>(
    `${contentUiNamespace}.rename-section`,
    'q-item-section'
  ),
  renameButton: ui<LinPulsarQBtnProps>(
    `${contentUiNamespace}.rename-section`,
    'q-btn'
  ),
  deleteSection: ui<LinPulsarQItemSectionProps>(
    `${contentUiNamespace}.delete-section`,
    'q-item-section'
  ),
  deleteButton: ui<LinPulsarQBtnProps>(
    `${contentUiNamespace}.delete-section`,
    'q-btn'
  ),
  createButton: ui<LinPulsarQBtnProps>(
    `${contentUiNamespace}.create-button`,
    'q-btn'
  ),
  overrideSection: ui<LinPulsarQItemSectionProps>(
    `${contentUiNamespace}.override-section`,
    'q-item-section'
  ),
  overrideButton: ui<LinPulsarQBtnProps>(
    `${contentUiNamespace}.override-section`,
    'q-btn'
  ),
}));
</script>

<style>
.lin-pulsar-favorite-panel--list {
  max-height: 14rem;
  overflow-y: auto;
}
</style>

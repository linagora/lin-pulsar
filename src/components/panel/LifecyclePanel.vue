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
  <div
    v-if="isDisplayed"
    class="column q-gutter-y-sm q-mb-md lifecycle-panel"
    data-cy="lifecycle-panel"
  >
    <LifecycleBannersCard
      :ui-namespace="localUiNamespace"
      :i18n-scope="localI18nScope"
      :banners="banners"
      @action-click="({ key }) => runAction(key)"
    />

    <div
      v-for="infoText in infoTexts"
      :key="infoText.key"
      :class="`row items-center no-wrap q-gutter-x-sm lifecycle-panel--${infoText.key}`"
      :data-cy="`lifecycle-panel_${infoText.key}`"
    >
      <q-icon
        v-if="infoText.ui.icon.name"
        v-bind="infoText.ui.icon"
      />
      <q-item-label v-bind="infoText.ui.label">
        {{ infoText.message }}
      </q-item-label>
    </div>

    <LifecycleButtonsCard
      :ui-namespace="localUiNamespace"
      :i18n-scope="localI18nScope"
      :instance-id="instanceId"
      :entity="entity"
      :items="menuItems"
      @item-click="({ key }) => runAction(key)"
    />
  </div>
  <!-- v8 ignore stop -->
</template>

<script lang="ts" setup>
import type {
  LinPulsarQIconProps,
  LinPulsarQItemLabelProps,
  MenuItem,
} from '@linagora/lin-pulsar-core';
import {
  useCommonMapper,
  useLinPulsarZoneStore,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import { computed } from 'vue';
import {
  LIFECYCLE_BANNER_ACTIONS,
  useLifecycleUi,
} from '../../composables/useLifecycleUi';
import { useLifecycleActions } from '../../composables/useLifecycleActions';
import type { LifecycleBanner } from '../../types/lifecycleBannersCard';
import type { LifecycleButtonType } from '../../types/lifecycleButtonsCard';
import type {
  LifecycleBannerKey,
  LifecycleDateKey,
  LifecycleInfoTextKey,
  LifecyclePanelProps,
} from '../../types/lifecyclePanel';
import LifecycleBannersCard from '../card/LifecycleBannersCard.vue';
import LifecycleButtonsCard from '../card/LifecycleButtonsCard.vue';

const props = withDefaults(defineProps<LifecyclePanelProps>(), {
  entity: () => ({}),
  fields: () => ({}),
  enabledStates: () => ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
  deactivationWarningDays: 15,
  immediateActionDelay: 5,
  dateFormatKey: 'application.dateFormat',
  actions: () => ({}),
});

/**
 * Lifecycle date displayed by each info text, if any.
 */
const INFO_TEXT_DATES: Record<LifecycleInfoTextKey, LifecycleDateKey | null> = {
  willDeactivate: 'validityEnd',
  willSuspend: 'suspensionStart',
  notActivated: null,
};

const localUiNamespace = `${props.uiNamespace}.lifecycle-panel`;
const localI18nScope = `${props.i18nScope}.LifecyclePanel`;

const { t } = useScopedI18n(localI18nScope);
const { ui } = useUiDesign();
const { toDate } = useCommonMapper();
const { hasZoneEntries } = useLinPulsarZoneStore();
const { toLifecycleState, toLifecycleUi } = useLifecycleUi();

const lifecycle = computed(() => toLifecycleState(props.entity, props.fields));

/**
 * Banners, info texts and candidate actions of the entity, or `null` when its status is not one of `enabledStates`.
 */
const lifecycleUi = computed(() =>
  props.enabledStates.includes(String(lifecycle.value.status))
    ? toLifecycleUi(lifecycle.value, props.deactivationWarningDays)
    : null
);

const { runAction } = useLifecycleActions(
  props,
  lifecycle,
  localUiNamespace,
  localI18nScope
);

/**
 * Whether an action is configured.
 * @param key - The key of the action.
 * @returns Whether `actions` defines the action.
 */
function isConfigured(key: string): boolean {
  return Object.hasOwn(props.actions, key);
}

/**
 * Formats a lifecycle date with the configured date format.
 * @param key - The key of the date in the lifecycle state.
 * @returns The formatted date, or an empty string when the date is not set.
 */
function formatDate(key: LifecycleDateKey): string {
  return toDate(lifecycle.value[key], props.dateFormatKey);
}

/**
 * Configured candidate actions of the dropdowns, grouped by lifecycle type.
 */
const menuItems = computed(() => {
  const items: Partial<Record<LifecycleButtonType, MenuItem[]>> = {};

  for (const key of lifecycleUi.value?.actions.filter(isConfigured) ?? []) {
    const type = key.split('.')[0] as LifecycleButtonType;

    (items[type] ??= []).push({ key, clickable: true });
  }

  return items;
});

/**
 * Banners of the entity with the values of their content and their configured actions. The suspended banner displays
 * the end of the suspension only when it is set.
 */
const banners = computed<LifecycleBanner[]>(() => {
  const params: Record<LifecycleBannerKey, LifecycleBanner['params']> = {
    suspended: {
      date: formatDate('suspensionStart'),
      endDate: formatDate('suspensionEnd'),
    },
    deactivated: { date: formatDate('validityEnd') },
    deactivationWarning: {
      date: formatDate('validityEnd'),
      count: lifecycle.value.daysBeforeDeactivation,
    },
  };

  return (lifecycleUi.value?.banners ?? []).map((key) => ({
    key,
    actions: LIFECYCLE_BANNER_ACTIONS[key].filter(isConfigured),
    params: params[key],
    content:
      key === 'suspended' && lifecycle.value.suspensionEnd
        ? 'contentWithEndDate'
        : 'content',
  }));
});

/**
 * Info texts of the entity with their translated message and their design properties.
 */
const infoTexts = computed(() =>
  (lifecycleUi.value?.infoTexts ?? []).map((key) => {
    const namespace = `${localUiNamespace}.info-texts.${key}`;
    const dateField = INFO_TEXT_DATES[key];

    return {
      key,
      message: t(`infoTexts.${key}`, {
        date: dateField ? formatDate(dateField) : '',
      }),
      ui: {
        icon: ui<LinPulsarQIconProps>(namespace, 'q-icon'),
        label: ui<LinPulsarQItemLabelProps>(namespace, 'q-item-label'),
      },
    };
  })
);

/**
 * Whether the panel has something to display: a banner, an info text, a dropdown action, or a component in a zone of
 * the dropdowns card.
 */
const isDisplayed = computed(
  () =>
    lifecycleUi.value !== null &&
    (banners.value.length > 0 ||
      infoTexts.value.length > 0 ||
      Object.keys(menuItems.value).length > 0 ||
      hasZoneEntries(`${localUiNamespace}.lifecycle-buttons-card.prepend`) ||
      hasZoneEntries(`${localUiNamespace}.lifecycle-buttons-card.append`))
);
</script>

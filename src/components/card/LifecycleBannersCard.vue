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
  <q-card
    v-if="displayedBanners.length > 0"
    v-bind="uiProps.card"
    class="lifecycle-banners-card"
    data-cy="lifecycle-banners-card"
  >
    <div class="column q-gutter-y-sm">
      <q-banner
        v-for="banner in displayedBanners"
        :key="banner.key"
        v-bind="banner.ui.banner"
        :class="`lifecycle-banners-card--${banner.key}`"
        :data-cy="`lifecycle-banners-card_${banner.key}`"
      >
        <template
          v-if="banner.ui.icon.name"
          #avatar
        >
          <q-icon v-bind="banner.ui.icon" />
        </template>

        {{ banner.content }}

        <template
          v-if="banner.actions.length > 0"
          #action
        >
          <q-btn
            v-for="action in banner.actions"
            :key="action.key"
            :label="action.label"
            v-bind="action.ui"
            :data-cy="`lifecycle-banners-card_${banner.key}_${action.key}`"
            @click="onActionClick(action.key)"
          />
        </template>
      </q-banner>
    </div>
  </q-card>
  <!-- v8 ignore stop -->
</template>

<script lang="ts" setup>
import type {
  LinPulsarQBannerProps,
  LinPulsarQBtnProps,
  LinPulsarQCardProps,
  LinPulsarQIconProps,
} from '@linagora/lin-pulsar-core';
import {
  getNestedValue,
  uiEventSubject,
  useNunjucks,
  useScopedI18n,
  useUiDesign,
  useValueFormatter,
} from '@linagora/lin-pulsar-core';
import { computed } from 'vue';
import type {
  LifecycleBanner,
  LifecycleBannersCardOutputs,
  LifecycleBannersCardProps,
} from '../../types/lifecycleBannersCard';

const props = withDefaults(defineProps<LifecycleBannersCardProps>(), {
  entity: () => ({}),
});

const emit = defineEmits<LifecycleBannersCardOutputs>();

const localUiNamespace = `${props.uiNamespace}.lifecycle-banners-card`;

const { t } = useScopedI18n(`${props.i18nScope}.LifecycleBannersCard`);
const { ui } = useUiDesign();
const { renderString } = useNunjucks();
const { formatValue } = useValueFormatter();

const uiProps = {
  card: ui<LinPulsarQCardProps>(localUiNamespace, 'q-card'),
};

/**
 * Configured banners, keeping the first configuration of each key, with their translated content, their buttons, each
 * action being kept once, and their design properties.
 */
const displayedBanners = computed(() =>
  props.banners
    .filter(
      (banner, index, banners) =>
        banners.findIndex(({ key }) => key === banner.key) === index
    )
    .map((banner) => {
      const namespace = `${localUiNamespace}.${banner.key}`;

      return {
        key: banner.key,
        content: t(`${banner.key}.${contentKey(banner)}`, toParams(banner)),
        actions: [...new Set(banner.actions)].map((key) => ({
          key,
          label: t(`${banner.key}.actions.${key}`),
          ui: ui<LinPulsarQBtnProps>(`${namespace}.actions.${key}`, 'q-btn'),
        })),
        ui: {
          banner: ui<LinPulsarQBannerProps>(namespace, 'q-banner'),
          icon: ui<LinPulsarQIconProps>(namespace, 'q-icon'),
        },
      };
    })
);

/**
 * Translation key of the content of a banner, relative to its key: its `content` template rendered with the entity, or
 * `content` when it defines none.
 * @param banner - The banner configuration.
 * @returns The translation key of the content.
 */
function contentKey(banner: LifecycleBanner): string {
  return banner.content
    ? renderString(banner.content, { entity: props.entity }).trim()
    : 'content';
}

/**
 * Named parameters of the content of a banner, each read from its entity field and formatted with its formatter. The
 * values are not converted to strings, so that a numeric `count` still selects the plural form.
 * @param banner - The banner configuration.
 * @returns The named parameters of the content translation.
 */
function toParams(banner: LifecycleBanner): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(banner.params ?? {}).map(([name, param]) => [
      name,
      formatValue(
        getNestedValue(props.entity, param.field),
        param.formatter,
        param.formatOptions
      ),
    ])
  );
}

/**
 * Emits the clicked action, then publishes it on `emitOnClick` if configured.
 * @param key - The key of the action.
 */
function onActionClick(key: string): void {
  emit('actionClick', { key });

  if (props.emitOnClick) {
    uiEventSubject.next({ key: props.emitOnClick, data: { key } });
  }
}
</script>

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
  <!--
    The active tab follows the route only: the local selection Quasar applies on click is ignored,
    so that a tab opened in a new tab (Ctrl, Cmd or middle click) does not move the highlight.
  -->
  <q-tabs
    v-bind="uiProps.tabs"
    :model-value="activeTabPath"
    class="navigation-menu"
    data-cy="navigation-menu"
    @update:model-value="() => undefined"
  >
    <router-link
      v-for="item in props.items"
      :key="item.id"
      :to="item.path"
      class="navigation-menu--link"
    >
      <q-tab
        v-bind="uiProps.routes[item.id]"
        :name="item.path"
        :label="t(item.labelKey)"
        :class="`navigation-menu--${item.id}`"
        :data-cy="`item_${item.id}`"
        tabindex="-1"
      />
    </router-link>
  </q-tabs>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type {
  LinPulsarQRouteTabProps,
  LinPulsarQTabsProps,
  NavigationMenuItem,
} from '@linagora/lin-pulsar-core';
import { useUiDesign } from '@linagora/lin-pulsar-core';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type {
  NavigationMenuOutputs,
  NavigationMenuProps,
  NavigationMenuUIProps,
} from '../../types/navigationMenu';

const props = defineProps<NavigationMenuProps>();

const emit = defineEmits<NavigationMenuOutputs>();

const { ui } = useUiDesign();
const { t } = useI18n();
const route = useRoute();

const localUiNamespace = `${props.uiNamespace}.navigation-menu`;

/**
 * Compiles the activation regex of a navigation item.
 * @param item - The navigation item.
 * @returns The compiled regex, or undefined when the item has none or when it is invalid.
 */
function compileActiveRegex(item: NavigationMenuItem): RegExp | undefined {
  if (!item.activeRegex) {
    return undefined;
  }
  try {
    return new RegExp(item.activeRegex);
  } catch (e) {
    console.error(
      `[NavigationMenu] Invalid active regex for the item "${item.id}"`,
      e
    );
    return undefined;
  }
}

/**
 * Compiled activation regex of each navigation item, indexed by item id.
 * Computed from the items only, so that an invalid regex is reported once.
 */
const activeRegexes = computed(() =>
  props.items.reduce<Record<string, RegExp | undefined>>(
    (acc, item) => ({ ...acc, [item.id]: compileActiveRegex(item) }),
    {}
  )
);

/**
 * Tells whether a navigation item is active for a route path: through its activation regex
 * when it has a valid one, otherwise on its path and its sub-paths (prefix matching).
 * @param item - The navigation item.
 * @param path - The route path.
 * @returns True when the item is active for the path.
 */
function isItemActive(item: NavigationMenuItem, path: string): boolean {
  const activeRegex = activeRegexes.value[item.id];
  if (activeRegex) {
    return activeRegex.test(path);
  }
  return path === item.path || path.startsWith(`${item.path}/`);
}

/**
 * Resolves the active tab path: the active item with the longest path.
 */
const activeTabPath = computed(() => {
  const sorted = [...props.items].sort((a, b) => b.path.length - a.path.length);
  return sorted.find((item) => isItemActive(item, route.path))?.path;
});

const uiProps: NavigationMenuUIProps = {
  tabs: ui<LinPulsarQTabsProps>(localUiNamespace, 'q-tabs'),
  routes: props.items.reduce((acc, item) => {
    return {
      ...acc,
      [item.id]: ui<LinPulsarQRouteTabProps>(
        `${localUiNamespace}.route-${item.id}`,
        'q-route-tab'
      ),
    };
  }, {}),
};

/**
 * Watches for route changes and emits the active item.
 */
watch(
  activeTabPath,
  (activePath) => {
    const selectedItem = props.items.find((item) => item.path === activePath);
    if (selectedItem) {
      emit('update:activeItem', selectedItem);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/*
 * Each tab is wrapped in a router link so that the browser keeps its link controls (open in a new
 * tab, copy the link address). The link is the focusable element and takes the tab styling over.
 */
.navigation-menu--link {
  display: flex;
  align-self: stretch;
  color: inherit;
  text-decoration: none;
}
</style>

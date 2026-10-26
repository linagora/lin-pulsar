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
  <q-layout view="hHh LpR fFf">
    <q-header
      v-bind="uiProps.header"
      data-cy="header"
    >
      <q-toolbar
        v-bind="uiProps.toolbar"
        data-cy="toolbar"
      >
        <router-link
          to="/"
          class="base-layout--home-link"
        >
          <q-avatar
            v-bind="uiProps.avatar"
            data-cy="application_logo"
          >
            <q-img v-bind="uiProps.img"> </q-img>
          </q-avatar>
        </router-link>
        <q-toolbar-title v-bind="uiProps.toolbarTitle">
          <router-link
            to="/"
            data-cy="application_title"
            class="row inline base-layout--home-link"
          >
            {{ t('title') }}
          </router-link>
        </q-toolbar-title>
        <q-badge
          v-bind="uiProps.badge"
          :label="t('version')"
          data-cy="application_version"
        />
        <q-space />
        <HeaderProfile
          :ui-namespace="headerUiNamespace"
          :logout-path="logoutPath"
          :hide-logout="hideLogout"
        />
      </q-toolbar>
      <q-toolbar
        v-bind="uiProps.toolbar"
        class="block"
        data-cy="navigation_toolbar"
      >
        <NavigationMenu
          :items="uiStore.mainNavigationItems"
          :ui-namespace="headerUiNamespace"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component, route }">
        <component
          :is="Component"
          :key="(route.meta.instanceId as string | undefined) ?? route.path"
        />
      </router-view>
    </q-page-container>

    <LinPulsarZoneRenderer zone="base-layout.dialogComponent" />

    <!-- zone footer -->
  </q-layout>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type {
  LinPulsarQAvatarProps,
  LinPulsarQBadgeProps,
  LinPulsarQHeaderProps,
  LinPulsarQImgProps,
  LinPulsarQToolbarProps,
  LinPulsarQToolbarTitleProps,
} from '@linagora/lin-pulsar-core';
import {
  LinPulsarZoneRenderer,
  useLinPulsarUiStore,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import NavigationMenu from '../components/menu/NavigationMenu.vue';
import HeaderProfile from '../components/profile/HeaderProfile.vue';
import type { BaseLayoutRouteMeta } from '../types/baseLayout';

const { ui } = useUiDesign();
const { t } = useScopedI18n('application');
const uiStore = useLinPulsarUiStore();
const currentRoute = useRoute();

const routeMeta = computed(() => currentRoute.meta as BaseLayoutRouteMeta);
const logoutPath = computed(() => routeMeta.value.logoutPath ?? '/logout');
const hideLogout = computed(() => routeMeta.value.hideLogout === true);

const headerUiNamespace = 'base-layout.header';

const uiProps = {
  header: ui<LinPulsarQHeaderProps>(headerUiNamespace, 'q-header'),
  toolbar: ui<LinPulsarQToolbarProps>(headerUiNamespace, 'q-toolbar'),
  avatar: ui<LinPulsarQAvatarProps>(headerUiNamespace, 'q-avatar'),
  toolbarTitle: ui<LinPulsarQToolbarTitleProps>(
    headerUiNamespace,
    'q-toolbar-title'
  ),
  badge: ui<LinPulsarQBadgeProps>(headerUiNamespace, 'q-badge'),
  img: ui<LinPulsarQImgProps>(headerUiNamespace, 'q-img'),
};
</script>

<style scoped>
/* The logo and the title link to the home page without the default link styling of the browser. */
.base-layout--home-link {
  color: inherit;
  text-decoration: none;
}
</style>

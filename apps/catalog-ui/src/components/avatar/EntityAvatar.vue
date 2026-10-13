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
  <q-avatar
    v-bind="uiProps.avatar"
    class="entity-avatar"
    data-cy="entity-avatar"
  >
    <img
      v-if="diceBearSrc"
      :src="diceBearSrc"
      :alt="translateOrDefault('Avatar', 'avatarAlt')"
      class="entity-avatar--img"
      data-cy="entity-avatar_img"
    />
    <q-icon
      v-else
      name="question_mark"
      v-bind="uiProps.icon"
      class="entity-avatar--icon"
      data-cy="entity-avatar_icon"
    />
  </q-avatar>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type {
  LinidQAvatarProps,
  LinidQIconProps,
} from '@linagora/linid-im-front-corelib';
import { useScopedI18n, useUiDesign } from '@linagora/linid-im-front-corelib';
import { computed } from 'vue';
import { useDiceBearAvatar } from '../../composables/useDiceBearAvatar';
import type { EntityAvatarProps } from '../../types/entityAvatar';

const props = defineProps<EntityAvatarProps>();

const localUiNamespace = computed(() => {
  const prefix = props.uiNamespace || props.instanceId;
  return prefix ? `${prefix}.entity-avatar` : 'entity-avatar';
});

const localI18nScope = computed(() => {
  const prefix = props.i18nScope || props.instanceId;
  return prefix ? `${prefix}.EntityAvatar` : 'EntityAvatar';
});

const { ui } = useUiDesign();
const { translateOrDefault } = useScopedI18n(localI18nScope.value);

const uiProps = computed(() => ({
  avatar: ui<LinidQAvatarProps>(localUiNamespace.value, 'q-avatar'),
  icon: ui<LinidQIconProps>(localUiNamespace.value, 'q-icon'),
}));

const diceBearSrc = useDiceBearAvatar(
  () => props.avatarOptions,
  () => props.entity ?? {}
);
</script>

<style scoped></style>

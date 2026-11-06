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
  <!-- The default buttons are hidden explicitly: without dropdown, the empty default slot falls back to them. -->
  <ButtonsCard
    v-if="isDisplayed"
    :ui-namespace="localUiNamespace"
    :i18n-scope="localI18nScope"
    :show-confirm-button="false"
    :show-cancel-button="false"
    class="lifecycle-buttons-card"
    data-cy="lifecycle-buttons-card"
  >
    <template #prepend-buttons>
      <LinPulsarZoneRenderer
        :zone="zoneNames.prepend"
        :entity="entity"
        :instance-id="instanceId"
        :ui-namespace="localUiNamespace"
        :i18n-scope="localI18nScope"
      />
    </template>

    <DropdownButton
      v-for="button in displayedButtons"
      :key="button.type"
      :ui-namespace="`${localUiNamespace}.${button.type}`"
      :i18n-scope="`${localI18nScope}.${button.type}`"
      :items="button.items"
      :class="`lifecycle-buttons-card--${button.type}`"
      :data-cy="`lifecycle-buttons-card_${button.type}`"
      @item-click="(payload) => emit('itemClick', payload)"
    />

    <template #append-buttons>
      <LinPulsarZoneRenderer
        :zone="zoneNames.append"
        :entity="entity"
        :instance-id="instanceId"
        :ui-namespace="localUiNamespace"
        :i18n-scope="localI18nScope"
      />
    </template>
  </ButtonsCard>
  <!-- v8 ignore stop -->
</template>

<script lang="ts" setup>
import {
  LinPulsarZoneRenderer,
  useLinPulsarZoneStore,
} from '@linagora/lin-pulsar-core';
import { computed } from 'vue';
import type {
  LifecycleButtonsCardOutputs,
  LifecycleButtonsCardProps,
} from '../../types/lifecycleButtonsCard';
import { LIFECYCLE_BUTTON_TYPES } from '../../types/lifecycleButtonsCard';
import DropdownButton from '../button/DropdownButton.vue';
import ButtonsCard from './ButtonsCard.vue';

const props = withDefaults(defineProps<LifecycleButtonsCardProps>(), {
  entity: () => ({}),
});

const emit = defineEmits<LifecycleButtonsCardOutputs>();

const { hasZoneEntries } = useLinPulsarZoneStore();

const localUiNamespace = computed(
  () => `${props.uiNamespace}.lifecycle-buttons-card`
);
const localI18nScope = computed(
  () => `${props.i18nScope}.LifecycleButtonsCard`
);

const zoneNames = computed(() => ({
  prepend: `${localUiNamespace.value}.prepend`,
  append: `${localUiNamespace.value}.append`,
}));

/**
 * Buttons holding at least one menu item, in the order of `LIFECYCLE_BUTTON_TYPES`.
 */
const displayedButtons = computed(() =>
  LIFECYCLE_BUTTON_TYPES.map((type) => ({
    type,
    items: props.items[type] ?? [],
  })).filter((button) => button.items.length > 0)
);

/**
 * The card is hidden when it has neither a button to display nor a component registered in its zones.
 */
const isDisplayed = computed(
  () =>
    displayedButtons.value.length > 0 ||
    hasZoneEntries(zoneNames.value.prepend) ||
    hasZoneEntries(zoneNames.value.append)
);
</script>

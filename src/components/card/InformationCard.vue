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
    class="information-card"
    v-bind="uiProps.card"
  >
    <q-card-section
      v-bind="uiProps.titleSection"
      class="row justify-start items-center q-pa-sm"
    >
      <q-icon
        v-if="uiProps.icon.name"
        v-bind="uiProps.icon"
        class="q-mr-sm"
        size="sm"
      />
      <span
        class="text-italic information-card--title"
        data-cy="title"
      >
        {{ label }}
      </span>
    </q-card-section>
    <q-card-section
      v-bind="uiProps.contentSection"
      class="q-pa-sm q-pl-xl"
    >
      <slot
        v-if="isLoading"
        name="loading"
      >
        <blur-loader width="lg" />
      </slot>
      <slot v-else>
        <vue-json-pretty
          v-if="jsonData !== undefined"
          :data="jsonData"
          show-length
          show-icon
          class="information-card--json"
          data-cy="value"
        />
        <span
          v-else
          class="text-bold information-card--content"
          data-cy="value"
        >
          {{ displayValue }}
        </span>
      </slot>
    </q-card-section>
  </q-card>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type {
  LinPulsarQCardProps,
  LinPulsarQCardSectionProps,
  LinPulsarQIconProps,
} from '@linagora/lin-pulsar-core';
import { useUiDesign } from '@linagora/lin-pulsar-core';
import { computed } from 'vue';
import VueJsonPretty from 'vue-json-pretty';
import type { JSONDataType } from 'vue-json-pretty/types/utils';
import 'vue-json-pretty/lib/styles.css';
import type { InformationCardProps } from '../../types/InformationCard';
import BlurLoader from '../loader/BlurLoader.vue';

const props = withDefaults(defineProps<InformationCardProps>(), {
  label: '',
  isLoading: false,
  type: 'text',
});

/**
 * Whether the value is considered empty and rendered as a dash.
 * @param value - Value to check.
 * @returns True when the value is undefined, null or an empty string.
 */
function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * Value rendered in the content section: falls back to a dash when the value is empty, so empty attributes remain
 * visible.
 */
const displayValue = computed(() => {
  if (isEmpty(props.value)) {
    return '-';
  }

  return props.value;
});

/**
 * Data rendered by the JSON viewer when `type` is `json`, or `undefined` when the value must be
 * rendered as text (other type, empty value, invalid JSON string or non-serializable value).
 *
 * The value goes through a JSON round trip so that the viewer only receives plain JSON data:
 * circular references and BigInt values fall back to text instead of breaking the render.
 */
const jsonData = computed<JSONDataType | undefined>(() => {
  if (props.type !== 'json' || isEmpty(props.value)) {
    return undefined;
  }

  try {
    const json =
      typeof props.value === 'string'
        ? props.value
        : JSON.stringify(props.value);
    return json === undefined ? undefined : JSON.parse(json);
  } catch {
    return undefined;
  }
});

const { ui } = useUiDesign();
const localUiNamespace = `${props.uiNamespace}.information-card`;
const uiProps = {
  card: ui<LinPulsarQCardProps>(localUiNamespace, 'q-card'),
  icon: ui<LinPulsarQIconProps>(localUiNamespace, 'q-icon'),
  titleSection: ui<LinPulsarQCardSectionProps>(
    `${localUiNamespace}.title-section`,
    'q-card-section'
  ),
  contentSection: ui<LinPulsarQCardSectionProps>(
    `${localUiNamespace}.content-section`,
    'q-card-section'
  ),
};
</script>

<style scoped>
.information-card {
  min-width: 350px;
}

.information-card--json {
  max-height: 400px;
  overflow: auto;
}
</style>

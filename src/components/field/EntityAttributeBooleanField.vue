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
  <q-toggle
    v-model="localValue"
    :data-cy="`field_${definition.name}`"
    class="entity-attribute-boolean-field"
    v-bind="uiProps"
    :disable="definition.inputSettings?.disable || false"
    :label="translateOrDefault('', 'label')"
    :true-value="definition.inputSettings?.trueValue"
    :false-value="definition.inputSettings?.falseValue"
    @update:model-value="updateValue"
  />
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type { LinPulsarQToggleProps } from '@linagora/lin-pulsar-core';
import {
  getNestedValue,
  setNestedValue,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import { ref, watch } from 'vue';
import type {
  AttributeFieldProps,
  EntityAttributeFieldOutputs,
  FieldBooleanSettings,
} from '../../types/field';

const props = withDefaults(
  defineProps<AttributeFieldProps<FieldBooleanSettings>>(),
  {
    ignoreRules: false,
  }
);
const emits = defineEmits<EntityAttributeFieldOutputs>();

const { ui } = useUiDesign();

const localValue = ref(
  getNestedValue(props.entity, props.definition.name) ??
    props.definition.inputSettings?.defaultValue ??
    null
);
const uiProps = ui<LinPulsarQToggleProps>(
  `${props.uiNamespace}.${props.definition.name}`,
  'q-toggle'
);
const { translateOrDefault } = useScopedI18n(
  `${props.i18nScope}.fields.${props.definition.name}`
);

watch(
  () => getNestedValue(props.entity, props.definition.name),
  (newValue) => {
    localValue.value =
      newValue ?? props.definition.inputSettings?.defaultValue ?? null;
  }
);

/**
 * Emits an 'update:entity' event with the updated entity object when the toggle changes.
 * Updates the value of the attribute in the entity using the local reactive value.
 */
function updateValue() {
  emits(
    'update:entity',
    setNestedValue(props.entity, props.definition.name, localValue.value)
  );
}
</script>

<style lang="scss" scoped></style>

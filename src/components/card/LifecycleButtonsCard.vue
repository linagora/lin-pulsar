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
      :disable="button.disable"
      :class="`lifecycle-buttons-card--${button.type}`"
      :data-cy="`lifecycle-buttons-card_${button.type}`"
      @item-click="onItemClick"
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
import type { DropdownClickPayload, UiEvent } from '@linagora/lin-pulsar-core';
import {
  getHttpClient,
  LinPulsarZoneRenderer,
  uiEventSubject,
  useLinPulsarZoneStore,
  useNotify,
  useNunjucks,
  useScopedI18n,
} from '@linagora/lin-pulsar-core';
import type { Subscription } from 'rxjs';
import { computed, onMounted, onUnmounted, toRaw } from 'vue';
import { DialogKey } from '../../types/dialog';
import type {
  LifecycleAction,
  LifecycleButtonsCardOutputs,
  LifecycleButtonsCardProps,
} from '../../types/lifecycleButtonsCard';
import DropdownButton from '../button/DropdownButton.vue';
import ButtonsCard from './ButtonsCard.vue';

const props = withDefaults(defineProps<LifecycleButtonsCardProps>(), {
  buttons: () => [
    { type: 'activation' },
    { type: 'suspension' },
    { type: 'deactivation' },
  ],
  entity: () => ({}),
  actions: () => ({}),
  immediateActionDelay: 5,
});

const emit = defineEmits<LifecycleButtonsCardOutputs>();

const { hasZoneEntries } = useLinPulsarZoneStore();

const localUiNamespace = computed(
  () => `${props.uiNamespace}.lifecycle-buttons-card`
);
const localI18nScope = computed(
  () => `${props.i18nScope}.LifecycleButtonsCard`
);

const { t, translateOrDefault } = useScopedI18n(localI18nScope.value);
const { Notify } = useNotify();
const { render, renderString } = useNunjucks();

let eventSubscription: Subscription;

const zoneNames = computed(() => ({
  prepend: `${localUiNamespace.value}.prepend`,
  append: `${localUiNamespace.value}.append`,
}));

/**
 * Configured buttons holding at least one menu item, in configuration order, keeping the first configuration of each
 * type.
 */
const displayedButtons = computed(() =>
  props.buttons
    .filter(
      (button, index, buttons) =>
        buttons.findIndex(({ type }) => type === button.type) === index
    )
    .map(({ type, disable }) => ({
      type,
      disable: isDisabled(disable),
      items: props.items[type] ?? [],
    }))
    .filter((button) => button.items.length > 0)
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

/**
 * Whether a button is disabled: directly when `disable` is a boolean, or when it is a Nunjucks template rendering to
 * `true` with the entity.
 * @param disable - The `disable` configuration of the button.
 * @returns Whether the button is disabled.
 */
function isDisabled(disable: string | boolean | undefined): boolean {
  return typeof disable === 'string'
    ? renderString(disable, { entity: props.entity }).trim() === 'true'
    : Boolean(disable);
}

/**
 * Emits the clicked menu item, then runs the action configured for its key.
 * @param payload - The payload emitted by the dropdown button.
 */
function onItemClick(payload: DropdownClickPayload): void {
  emit('itemClick', payload);
  runAction(payload.key);
}

/**
 * Opens the dialog of the action configured for the given key: a form dialog sending the request with the submitted
 * data, or a confirmation dialog sending it once confirmed. When `fillFormWithEntity` is enabled, the form is pre-filled
 * with a deep copy of the entity, so that editing a nested field, such as `suspensionPeriod.end`, never changes the
 * entity of the page. The entity properties are available as named parameters in the dialog title and content
 * translations. Does nothing when no action is configured for the key.
 * @param key - The menu item key of the action, for example `suspension.immediate`.
 */
function runAction(key: string): void {
  if (!Object.hasOwn(props.actions, key)) {
    return;
  }

  const action = props.actions[key];
  const entity = props.entity;
  const dialogKey =
    action.dialog === 'form' ? 'FormDialog' : 'ConfirmationDialog';
  const dialog = {
    type: 'open',
    title: t(`actions.${key}.${dialogKey}.title`, entity),
    content: translateOrDefault(
      '',
      `actions.${key}.${dialogKey}.content`,
      entity
    ),
    uiNamespace: localUiNamespace.value,
    i18nScope: `${localI18nScope.value}.actions.${key}.${dialogKey}`,
  };

  if (action.dialog === 'form') {
    uiEventSubject.next({
      key: DialogKey.Form,
      data: {
        ...dialog,
        instanceId: props.instanceId,
        formFields: action.formFields ?? [],
        initialFormData: action.fillFormWithEntity
          ? structuredClone(toRaw(entity))
          : undefined,
        onSubmit: (formData: Record<string, unknown>) =>
          submitAction(key, action, formData),
      },
    });
    return;
  }

  uiEventSubject.next({
    key: DialogKey.Confirmation,
    data: {
      ...dialog,
      onConfirm: () => submitAction(key, action).catch(() => undefined),
    },
  });
}

/**
 * Sends the request of an action, with the URL and body rendered as Nunjucks templates with `entity`, the entity
 * merged with the submitted form data, and `immediateDate`, the ISO date `immediateActionDelay` minutes after now,
 * computed on submission so that a dialog left open does not send a past date. Then notifies the user, with the entity
 * and form data properties and the delay as `count` for the plural forms, and publishes `emitOnSubmit` if configured.
 * The notifications fall back to the `submitSuccess` and `submitError` keys of the card when the action defines none.
 * The top-level properties of the form data replace those of the entity, so that a scheduled period does not inherit
 * the bounds of the current one.
 * @param key - The menu item key of the action.
 * @param action - The action to send.
 * @param formData - The data submitted through the form dialog, if any.
 * @returns A promise that resolves once the request succeeded, and rejects when the rendering of the templates or the
 * request failed, so that the form dialog stays open for correction.
 */
async function submitAction(
  key: string,
  action: LifecycleAction,
  formData: Record<string, unknown> = {}
): Promise<void> {
  const entity = { ...props.entity, ...formData };
  const context = {
    entity,
    immediateDate: new Date(
      Date.now() + props.immediateActionDelay * 60_000
    ).toISOString(),
  };
  const messageParams = { ...entity, count: props.immediateActionDelay };

  try {
    const requestBody = render(action.body ?? {}, context);
    const { data } = await getHttpClient().request({
      method: action.method ?? 'POST',
      url: renderString(action.url, context),
      data: Object.keys(requestBody).length > 0 ? requestBody : undefined,
    });

    Notify({
      type: 'positive',
      message: translateOrDefault(
        t('submitSuccess', messageParams),
        `actions.${key}.submitSuccess`,
        messageParams
      ),
    });

    if (props.emitOnSubmit) {
      uiEventSubject.next({ key: props.emitOnSubmit, data });
    }
  } catch (error) {
    Notify({
      type: 'negative',
      message: translateOrDefault(
        t('submitError', messageParams),
        `actions.${key}.submitError`,
        messageParams
      ),
    });
    throw error;
  }
}

onMounted(() => {
  eventSubscription = uiEventSubject.subscribe((event: UiEvent) => {
    if (props.triggerActionOn && event.key === props.triggerActionOn) {
      runAction((event.data as DropdownClickPayload | undefined)?.key ?? '');
    }
  });
});

onUnmounted(() => {
  eventSubscription?.unsubscribe();
});
</script>

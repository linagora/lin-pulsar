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
  <q-page
    class="row justify-center q-pa-md generic-details-page"
    data-cy="generic-details-page"
  >
    <div class="col-12 col-md-10 col-lg-10">
      <LinPulsarZoneRenderer
        :zone="`${instanceId}.header.before`"
        :entity="entity || {}"
        :instance-id="instanceId"
        :ui-namespace="uiNamespace"
        :i18n-scope="i18nScope"
        :parent-path="parentPath"
      />

      <div
        class="row items-center justify-between q-mb-md generic-details-page--header"
      >
        <div class="row items-center q-gutter-x-md">
          <LinPulsarZoneRenderer
            :zone="`${instanceId}.header.prefix`"
            :entity="entity || {}"
            :instance-id="instanceId"
            :ui-namespace="uiNamespace"
            :i18n-scope="i18nScope"
            :parent-path="parentPath"
          />
          <h1
            v-if="te('title')"
            class="q-ma-none text-h5 generic-details-page--title"
            data-cy="generic-details-page_title"
          >
            {{ t('title') }}
          </h1>
          <LinPulsarZoneRenderer
            :zone="`${instanceId}.header.suffix`"
            :entity="entity || {}"
            :instance-id="instanceId"
            :ui-namespace="uiNamespace"
            :i18n-scope="i18nScope"
            :parent-path="parentPath"
          />
        </div>
        <div
          v-if="options.enableActions !== false"
          class="generic-details-page--actions"
        >
          <ButtonsCard
            :ui-namespace="uiNamespace"
            :i18n-scope="i18nScope"
            :show-confirm-button="false"
            @cancel="goBack"
          >
            <template #append-buttons>
              <LinPulsarZoneRenderer
                :zone="`${instanceId}.header.actions`"
                :entity="entity || {}"
                :instance-id="instanceId"
                :ui-namespace="uiNamespace"
                :i18n-scope="i18nScope"
                :parent-path="parentPath"
              />
              <q-btn
                v-if="options.editPath"
                v-bind="uiProps.editButton"
                class="buttons-card--edit-button"
                :label="t('ButtonsCard.edit')"
                data-cy="button_edit"
                :to="editRoute"
              />
            </template>
          </ButtonsCard>
        </div>
      </div>

      <LinPulsarZoneRenderer
        :zone="`${instanceId}.header.after`"
        :entity="entity || {}"
        :instance-id="instanceId"
        :ui-namespace="uiNamespace"
        :i18n-scope="i18nScope"
        :parent-path="parentPath"
      />

      <div class="row q-gutter-sm generic-details-page--content">
        <div
          class="flex column col-auto generic-details-page--content--side-left"
        >
          <LinPulsarZoneRenderer
            :zone="`${instanceId}.side-left`"
            :entity="entity || {}"
            :entity-id="entityId"
            :instance-id="instanceId"
            :ui-namespace="uiNamespace"
            :i18n-scope="i18nScope"
            :parent-path="parentPath"
            :is-loading="isLoading"
          />
        </div>

        <div class="col generic-details-page--content--main">
          <LinPulsarZoneRenderer
            :zone="`${instanceId}.content.before`"
            :entity="entity || {}"
            :entity-id="entityId"
            :instance-id="instanceId"
            :ui-namespace="uiNamespace"
            :i18n-scope="i18nScope"
            :parent-path="parentPath"
            :is-loading="isLoading"
          />

          <EntityDetailsCard
            v-for="section in options.sections"
            :key="section.key"
            :entity="entity || {}"
            :field-order="section.fieldOrder"
            :formatters="section.formatters"
            :show-remaining-fields="section.showRemainingFields || false"
            :is-loading="isLoading"
            :ui-namespace="`${uiNamespace}.sections.${section.key}`"
            :i18n-scope="`${i18nScope}.sections.${section.key}`"
            class="q-mb-md q-px-md generic-details-page--section"
            :data-cy="`details-section_${section.key}`"
          />

          <LinPulsarZoneRenderer
            :zone="`${instanceId}.content.after`"
            :entity="entity || {}"
            :entity-id="entityId"
            :instance-id="instanceId"
            :ui-namespace="uiNamespace"
            :i18n-scope="i18nScope"
            :parent-path="parentPath"
            :is-loading="isLoading"
          />
        </div>

        <div
          class="flex column col-auto generic-details-page--content--side-right"
        >
          <LinPulsarZoneRenderer
            :zone="`${instanceId}.side-right`"
            :entity="entity || {}"
            :entity-id="entityId"
            :instance-id="instanceId"
            :ui-namespace="uiNamespace"
            :i18n-scope="i18nScope"
            :parent-path="parentPath"
            :is-loading="isLoading"
          />
        </div>
      </div>
    </div>
  </q-page>
  <!-- v8 ignore stop -->
</template>

<script setup lang="ts">
import type { LinPulsarQBtnProps, UiEvent } from '@linagora/lin-pulsar-core';
import {
  getEntityById,
  getModuleHostConfiguration,
  LinPulsarZoneRenderer,
  uiEventSubject,
  useNotify,
  useNunjucks,
  useScopedI18n,
  useUiDesign,
} from '@linagora/lin-pulsar-core';
import type { Subscription } from 'rxjs';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ButtonsCard from '../components/card/ButtonsCard.vue';
import EntityDetailsCard from '../components/card/EntityDetailsCard.vue';
import type { ModuleGenericDetailsPageOptions } from '../types/ModuleGenericDetailsPageOptions';

const route = useRoute();
const router = useRouter();
const instanceId = computed<string>(() => route.meta.instanceId as string);
const entityId = computed(() => route.params.id as string);
const i18nScope = computed<string>(() => `${instanceId.value}`);
const uiNamespace = computed(() => `${instanceId.value}`);
const options = computed(
  () =>
    getModuleHostConfiguration<ModuleGenericDetailsPageOptions>(
      instanceId.value
    )!.options
);
const parentPath = computed(() => options.value.parentPath);

const { t, te } = useScopedI18n(i18nScope.value);
const { Notify } = useNotify();
const { ui } = useUiDesign();
const { renderString } = useNunjucks();

const entity = ref<Record<string, unknown> | null>(null);
const isLoading = ref<boolean>(false);
let eventSubscription: Subscription;

const uiProps = computed(() => ({
  editButton: ui<LinPulsarQBtnProps>(
    `${uiNamespace.value}.buttons-card.edit-button`,
    'q-btn'
  ),
}));

/**
 * Loads the entity data based on the route identifier. On failure, notifies the user and navigates
 * back.
 */
async function loadData() {
  isLoading.value = true;
  try {
    entity.value = await getEntityById<Record<string, unknown>>(
      instanceId.value,
      entityId.value
    );
  } catch {
    Notify({
      type: 'negative',
      message: t('error'),
    });
    goBack();
  } finally {
    isLoading.value = false;
  }
}

/**
 * Route of the edit page of the current entity, resolved by rendering the configured `editPath`
 * template with the loaded entity (`entity`) and the current query string (`query`) as context
 * (e.g. `"/applications/{{ entity.id }}/edit"`). Bound to the edit button link so that the router
 * handles a click while the browser keeps its link controls, such as opening the route in a new tab.
 * Undefined when no `editPath` is configured, the button not being rendered in that case.
 */
const editRoute = computed(() =>
  options.value.editPath
    ? renderString(options.value.editPath, {
        entity: entity.value ?? {},
        query: route.query,
      })
    : undefined
);

/**
 * Navigates back to the previous page, using the browser history when possible and falling back to
 * the parent route otherwise.
 *
 * The target path is built by rendering `parentPath` as a Nunjucks template with the loaded entity
 * (`entity`) and the current query string (`query`) as context, so the redirect URL can reference
 * either (e.g. `"/groups/{{ query.groupId }}/members"`).
 *
 * This is also called from `loadData()` when the entity fails to load, with `entity` still empty.
 */
function goBack() {
  if (router.options.history.state.back) {
    router.back();
  } else {
    router.push(
      renderString(parentPath.value, {
        entity: entity.value ?? {},
        query: route.query,
      })
    );
  }
}

onMounted(() => {
  eventSubscription = uiEventSubject.subscribe((event: UiEvent) => {
    if (options.value?.reloadDetailsOn?.includes(event.key)) {
      loadData();
    }
  });
  loadData();
});

onUnmounted(() => {
  eventSubscription?.unsubscribe();
});
</script>

<style scoped></style>

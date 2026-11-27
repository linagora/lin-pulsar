/*
 * Copyright (C) 2026 Linagora
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General
 * Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option)
 * any later version, provided you comply with the Additional Terms applicable for LinOpenFactory software by
 * LINAGORA pursuant to Section 7 of the GNU Affero General Public License, subsections (b), (c), and (e), pursuant to
 * which these Appropriate Legal Notices must notably (i) retain the display of the "LinOpenFactory™" trademark/logo at the top
 * of the interface window, the display of the “You are using the Open Source and free version of LinOpenFactory™, powered by
 * Linagora © 2009–2026. Contribute to LinOpenFactory R&D by subscribing to an Enterprise offer!” infobox and in the e-mails
 * sent with the Program, notice appended to any type of outbound messages (e.g. e-mail and meeting requests) as well
 * as in the LinOpenFactory user interface, (ii) retain all hypertext links between LinOpenFactory
 * and https://linid.org/, as well as between LINAGORA and LINAGORA.com, and (iii) refrain from infringing LINAGORA
 * intellectual property rights over its trademarks and commercial brands. Other Additional Terms apply, see
 * <http://www.linagora.com/licenses/> for more details.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License and its applicable Additional Terms for
 * LinOpenFactory along with this program. If not, see <http://www.gnu.org/licenses/> for the GNU Affero
 * General Public License version 3 and <http://www.linagora.com/licenses/> for the Additional Terms applicable to the
 * LinOpenFactory software.
 */

import {
  getHttpClient,
  uiEventSubject,
  useNotify,
  useNunjucks,
  useScopedI18n,
} from '@linagora/lin-pulsar-core';
import { type Ref, toRaw } from 'vue';
import { DialogKey } from '../types/dialog';
import type {
  LifecycleAction,
  LifecycleActionKey,
  LifecycleActionsProps,
  LifecycleState,
} from '../types/lifecyclePanel';

/**
 * Composable running the configured lifecycle actions: it opens the dialog of an action, sends its request once the
 * dialog is confirmed, notifies the user and publishes the configured event. The props are read when an action runs,
 * so that it follows their updates.
 * @param props - The props of the panel.
 * @param lifecycle - The lifecycle state of the entity, provided to the templates as `lifecycle`.
 * @param uiNamespace - The UI namespace of the dialogs, which append their own `form-dialog` or `confirmation-dialog`
 * namespace.
 * @param i18nScope - The i18n scope of the dialogs and of the notifications.
 * @returns The `runAction` function, running the action of a key.
 */
export function useLifecycleActions(
  props: LifecycleActionsProps,
  lifecycle: Readonly<Ref<LifecycleState>>,
  uiNamespace: string,
  i18nScope: string
) {
  const { t, translateOrDefault } = useScopedI18n(i18nScope);
  const { Notify } = useNotify();
  const { renderJson, renderString } = useNunjucks();

  /**
   * Opens the dialog of the action configured for the given key: a form dialog sending the request with the submitted
   * data when the action has form fields, otherwise a confirmation dialog sending it once confirmed. When
   * `fillFormWithEntity` is enabled, the form is pre-filled with a deep copy of the entity, so that editing a nested
   * field, such as `suspensionPeriod.end`, never changes the entity of the page. The entity properties are available
   * as named parameters in the dialog title and content translations. Does nothing when no action is configured for
   * the key.
   * @param key - The key of the action, for example `suspension.immediate`.
   */
  function runAction(key: string): void {
    if (!Object.hasOwn(props.actions, key)) {
      return;
    }

    const action = props.actions[key as LifecycleActionKey] as LifecycleAction;
    const entity = props.entity;
    const formFields = action.formFields ?? [];
    const dialogKey =
      formFields.length > 0 ? 'FormDialog' : 'ConfirmationDialog';
    const dialog = {
      type: 'open',
      title: t(`actions.${key}.${dialogKey}.title`, entity),
      content: translateOrDefault(
        '',
        `actions.${key}.${dialogKey}.content`,
        entity
      ),
      uiNamespace,
      i18nScope: `${i18nScope}.actions.${key}.${dialogKey}`,
    };

    if (formFields.length > 0) {
      uiEventSubject.next({
        key: DialogKey.Form,
        data: {
          ...dialog,
          instanceId: props.instanceId,
          formFields,
          initialFormData: action.fillFormWithEntity
            ? structuredClone(toRaw(entity))
            : undefined,
          onSubmit: (form: Record<string, unknown>) =>
            submitAction(key, action, form),
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
   * Sends the request of an action, with the URL rendered with `renderString` and the body with `renderJson`, both
   * with `entity`, the entity merged with the submitted form data, `form`, the submitted form data, `lifecycle`, the
   * lifecycle state, and `immediateDate`, the ISO date `immediateActionDelay` minutes after now, computed on submission
   * so that a dialog left open does not send a past date. Then notifies the user, with the entity and form data
   * properties and the delay as `count` for the plural forms, and publishes `emitOnSubmit` if configured. The
   * notifications fall back to the `submitSuccess` and `submitError` keys when the action defines none. The top-level
   * properties of the form data replace those of the entity, so that a scheduled period does not inherit the bounds of
   * the current one.
   * @param key - The key of the action.
   * @param action - The action to send.
   * @param form - The data submitted through the form dialog, if any.
   * @returns A promise that resolves once the request succeeded, and rejects when the rendering of the templates or the
   * request failed, so that the form dialog stays open for correction.
   */
  async function submitAction(
    key: string,
    action: LifecycleAction,
    form: Record<string, unknown> = {}
  ): Promise<void> {
    const delay = props.immediateActionDelay;
    const entity = { ...props.entity, ...form };
    const context = {
      entity,
      form,
      lifecycle: lifecycle.value,
      immediateDate: new Date(Date.now() + delay * 60_000).toISOString(),
    };
    const messageParams = { ...entity, count: delay };

    try {
      const body = renderJson(action.body ?? {}, context) as Record<
        string,
        unknown
      >;
      const { data } = await getHttpClient().request({
        method: action.method ?? 'POST',
        url: renderString(action.url, context),
        data: Object.keys(body).length > 0 ? body : undefined,
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

  return { runAction };
}

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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';
import { useLifecycleActions } from '../../../src/composables/useLifecycleActions';

let mockTranslations = {};
const mockNotify = vi.fn();
const mockRequest = vi.fn();
const mockUiEventNext = vi.fn();
const mockTranslateOrDefault = vi.fn(
  (defaultValue, key) => mockTranslations[key] ?? defaultValue
);
const mockT = vi.fn((key) => `t:${key}`);
const mockRenderJson = vi.fn((value, context) =>
  JSON.parse(
    JSON.stringify(value)
      .replace('"{{ form.reason }}"', JSON.stringify(context.form.reason))
      .replace('"{{ immediateDate }}"', JSON.stringify(context.immediateDate))
  )
);
const mockRenderString = vi.fn((template, context) =>
  template.replace(/\{\{ entity\.(\w+) \}\}/g, (_, property) =>
    String(context.entity[property])
  )
);

vi.mock('@linagora/lin-pulsar-core', () => ({
  getHttpClient: () => ({ request: mockRequest }),
  useNotify: () => ({ Notify: mockNotify }),
  useNunjucks: () => ({
    renderJson: (...args) => mockRenderJson(...args),
    renderString: (...args) => mockRenderString(...args),
  }),
  useScopedI18n: () => ({
    t: (...args) => mockT(...args),
    translateOrDefault: (...args) => mockTranslateOrDefault(...args),
  }),
  uiEventSubject: { next: (event) => mockUiEventNext(event) },
}));

describe('Test composable: useLifecycleActions', () => {
  const entity = { id: 'account-1', reason: 'initial reason' };
  const lifecycle = { status: 'ACTIVE' };

  const actions = {
    'suspension.scheduled': {
      url: '/accounts/{{ entity.id }}/status/suspend',
      method: 'PUT',
      body: { reason: '{{ form.reason }}' },
      formFields: [{ name: 'reason', type: 'String', input: 'Text' }],
    },
    'activation.immediate': {
      url: '/accounts/{{ entity.id }}/status/activate',
    },
  };

  /**
   * Creates the composable with the given props merged into the default ones.
   * @param props - Props overriding the default ones.
   * @returns The function running an action.
   */
  function useActions(props = {}) {
    return useLifecycleActions(
      {
        instanceId: 'test-instance',
        entity,
        actions,
        immediateActionDelay: 5,
        ...props,
      },
      ref(lifecycle),
      'test-namespace.lifecycle-panel',
      'test-scope.LifecyclePanel'
    ).runAction;
  }

  /**
   * Returns the data of the last event published on the UI event subject with the given key.
   * @param key - The key of the event.
   * @returns The data of the event, or undefined when no such event was published.
   */
  function lastEventData(key) {
    return mockUiEventNext.mock.calls
      .map(([event]) => event)
      .filter((event) => event.key === key)
      .at(-1)?.data;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockTranslations = {};
    mockRequest.mockResolvedValue({ data: { id: 'account-1' } });
  });

  describe('Test function: runAction', () => {
    it('should open the form dialog of an action with form fields', () => {
      mockTranslations = {
        'actions.suspension.scheduled.FormDialog.content': 'Suspend it?',
      };

      useActions()('suspension.scheduled');

      expect(lastEventData('form')).toEqual({
        type: 'open',
        title: 't:actions.suspension.scheduled.FormDialog.title',
        content: 'Suspend it?',
        uiNamespace: 'test-namespace.lifecycle-panel',
        i18nScope:
          'test-scope.LifecyclePanel.actions.suspension.scheduled.FormDialog',
        instanceId: 'test-instance',
        formFields: actions['suspension.scheduled'].formFields,
        initialFormData: undefined,
        onSubmit: expect.any(Function),
      });
      expect(mockT).toHaveBeenCalledWith(
        'actions.suspension.scheduled.FormDialog.title',
        entity
      );
      expect(mockTranslateOrDefault).toHaveBeenCalledWith(
        '',
        'actions.suspension.scheduled.FormDialog.content',
        entity
      );
    });

    it('should pre-fill the form with a deep copy of the entity when configured', () => {
      const nestedEntity = { id: 'account-1', period: { end: 'initial' } };
      const runAction = useActions({
        entity: nestedEntity,
        actions: {
          'suspension.modify': {
            ...actions['suspension.scheduled'],
            fillFormWithEntity: true,
          },
        },
      });

      runAction('suspension.modify');
      const { initialFormData } = lastEventData('form');
      initialFormData.period.end = 'edited';

      expect(initialFormData.id).toEqual('account-1');
      expect(nestedEntity.period.end).toEqual('initial');
    });

    it('should open the confirmation dialog of an action without form fields', () => {
      useActions()('activation.immediate');

      expect(lastEventData('confirmation')).toEqual({
        type: 'open',
        title: 't:actions.activation.immediate.ConfirmationDialog.title',
        content: '',
        uiNamespace: 'test-namespace.lifecycle-panel',
        i18nScope:
          'test-scope.LifecyclePanel.actions.activation.immediate.ConfirmationDialog',
        onConfirm: expect.any(Function),
      });
    });

    it('should open the confirmation dialog of an action with an empty form', () => {
      useActions({
        actions: {
          'activation.immediate': { url: '/activate', formFields: [] },
        },
      })('activation.immediate');

      expect(lastEventData('confirmation')).toBeDefined();
      expect(lastEventData('form')).toBeUndefined();
    });

    it('should read the props when the action is run', () => {
      const props = reactive({ entity, actions: {}, immediateActionDelay: 5 });
      const { runAction } = useLifecycleActions(
        props,
        ref(lifecycle),
        'test-namespace.lifecycle-panel',
        'test-scope.LifecyclePanel'
      );
      props.actions = actions;

      runAction('activation.immediate');

      expect(lastEventData('confirmation')).toBeDefined();
    });

    it('should ignore the actions that are not configured', () => {
      const runAction = useActions();

      runAction('deactivation.modify');
      runAction('constructor');

      expect(mockUiEventNext).not.toHaveBeenCalled();
    });
  });

  describe('Test function: submitAction', () => {
    it('should send the rendered request with the entity, the form, the lifecycle and immediateDate', async () => {
      useActions()('suspension.scheduled');

      await lastEventData('form').onSubmit({ reason: 'submitted reason' });

      expect(mockRenderJson).toHaveBeenCalledWith(
        actions['suspension.scheduled'].body,
        {
          entity: { id: 'account-1', reason: 'submitted reason' },
          form: { reason: 'submitted reason' },
          lifecycle,
          immediateDate: expect.any(String),
        }
      );
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/accounts/account-1/status/suspend',
        data: { reason: 'submitted reason' },
      });
    });

    it('should send a POST request without body by default', async () => {
      useActions()('activation.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/accounts/account-1/status/activate',
        data: undefined,
      });
    });

    it('should notify the success message of the action', async () => {
      mockTranslations = {
        'actions.activation.immediate.submitSuccess': 'Account activated',
      };
      useActions()('activation.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockNotify).toHaveBeenCalledWith({
        type: 'positive',
        message: 'Account activated',
      });
    });

    it('should fall back to the default success message', async () => {
      useActions()('activation.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockNotify).toHaveBeenCalledWith({
        type: 'positive',
        message: 't:submitSuccess',
      });
    });

    it('should publish emitOnSubmit with the response body', async () => {
      useActions({ emitOnSubmit: 'lifecycle-updated' })('activation.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(lastEventData('lifecycle-updated')).toEqual({ id: 'account-1' });
    });

    it('should notify the error and keep the form dialog open when the request fails', async () => {
      mockRequest.mockRejectedValue(new Error('Bad request'));
      useActions({ emitOnSubmit: 'lifecycle-updated' })('suspension.scheduled');

      await expect(
        lastEventData('form').onSubmit({ reason: 'x' })
      ).rejects.toThrow('Bad request');
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'negative',
        message: 't:submitError',
      });
      expect(lastEventData('lifecycle-updated')).toBeUndefined();
    });

    it('should notify the error and close the confirmation dialog when a template cannot be rendered', async () => {
      mockRenderJson.mockImplementationOnce(() => {
        throw new Error('Template render error');
      });
      useActions()('activation.immediate');

      await expect(
        lastEventData('confirmation').onConfirm()
      ).resolves.toBeUndefined();
      expect(mockRequest).not.toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'negative',
        message: 't:submitError',
      });
    });

    it('should notify the error of the action and close the confirmation dialog when the request fails', async () => {
      mockRequest.mockRejectedValue(new Error('Bad request'));
      mockTranslations = {
        'actions.activation.immediate.submitError': 'Activation failed',
      };
      useActions()('activation.immediate');

      await expect(
        lastEventData('confirmation').onConfirm()
      ).resolves.toBeUndefined();
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'Activation failed',
      });
    });
  });

  describe('Test option: immediateActionDelay', () => {
    const immediateActions = {
      'suspension.immediate': {
        url: '/accounts/{{ entity.id }}/status/suspend',
        method: 'PUT',
        body: { start: '{{ immediateDate }}' },
      },
    };

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-29T10:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render immediateDate from the submission date', async () => {
      useActions({ actions: immediateActions })('suspension.immediate');
      vi.setSystemTime(new Date('2026-10-29T10:30:00.000Z'));

      await lastEventData('confirmation').onConfirm();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { start: '2026-10-29T10:35:00.000Z' },
        })
      );
    });

    it('should render immediateDate with the configured delay', async () => {
      useActions({
        actions: immediateActions,
        immediateActionDelay: 60,
      })('suspension.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { start: '2026-10-29T11:00:00.000Z' },
        })
      );
    });

    it('should provide the delay as count to the notifications', async () => {
      useActions({
        actions: immediateActions,
        immediateActionDelay: 60,
      })('suspension.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockTranslateOrDefault).toHaveBeenCalledWith(
        't:submitSuccess',
        'actions.suspension.immediate.submitSuccess',
        { ...entity, count: 60 }
      );
    });
  });
});

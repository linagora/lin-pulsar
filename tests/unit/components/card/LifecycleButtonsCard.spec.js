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

import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LifecycleButtonsCard from '../../../../src/components/card/LifecycleButtonsCard.vue';

let mockZones = {};
let mockTranslations = {};
let mockUiEventCallback;
const mockNotify = vi.fn();
const mockRequest = vi.fn();
const mockUiEventNext = vi.fn();
const mockUnsubscribe = vi.fn();
const mockTranslateOrDefault = vi.fn(
  (defaultValue, key) => mockTranslations[key] ?? defaultValue
);
const mockT = vi.fn((key) => `t:${key}`);
const mockRender = vi.fn((value, context) =>
  JSON.parse(
    JSON.stringify(value)
      .replace('{{ entity.reason }}', context.entity.reason)
      .replace('{{ immediateDate }}', context.immediateDate)
  )
);

vi.mock('@linagora/lin-pulsar-core', () => ({
  LinPulsarZoneRenderer: { template: '<div />' },
  useLinPulsarZoneStore: () => ({
    hasZoneEntries: (zone) => (mockZones[zone]?.length ?? 0) > 0,
  }),
  getHttpClient: () => ({ request: mockRequest }),
  useNotify: () => ({ Notify: mockNotify }),
  useNunjucks: () => ({
    renderString: (template, context) =>
      template.replace(/\{\{ entity\.(\w+) \}\}/g, (_, property) =>
        String(context.entity[property])
      ),
    render: (...args) => mockRender(...args),
  }),
  useScopedI18n: () => ({
    t: (...args) => mockT(...args),
    translateOrDefault: (...args) => mockTranslateOrDefault(...args),
  }),
  uiEventSubject: {
    next: (event) => mockUiEventNext(event),
    subscribe: (callback) => {
      mockUiEventCallback = callback;
      return { unsubscribe: mockUnsubscribe };
    },
  },
}));

describe('Test component: LifecycleButtonsCard', () => {
  const activationItems = [{ key: 'activation.immediate', clickable: true }];
  const suspensionItems = [{ key: 'suspension.scheduled', clickable: true }];
  const deactivationItems = [{ key: 'deactivation.modify', clickable: true }];

  const defaultProps = {
    uiNamespace: 'test-namespace',
    i18nScope: 'test-scope',
    items: {
      activation: activationItems,
      suspension: suspensionItems,
      deactivation: deactivationItems,
    },
  };

  /**
   * Mounts the component with the given props merged into the default ones.
   * @param props - Props overriding the default ones.
   * @returns The mounted wrapper.
   */
  function mountCard(props = {}) {
    return shallowMount(LifecycleButtonsCard, {
      props: { ...defaultProps, ...props },
    });
  }

  const entity = { id: 'account-1', reason: 'initial reason' };

  const actions = {
    'suspension.scheduled': {
      dialog: 'form',
      url: '/accounts/{{ entity.id }}/status/suspend',
      method: 'PUT',
      body: { reason: '{{ entity.reason }}' },
      formFields: [{ name: 'reason', type: 'String', input: 'Text' }],
    },
    'activation.immediate': {
      dialog: 'confirmation',
      url: '/accounts/{{ entity.id }}/status/activate',
    },
  };

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
    mockZones = {};
    mockTranslations = {};
    mockUiEventCallback = undefined;
    mockRequest.mockResolvedValue({ data: { id: 'account-1' } });
  });

  describe('Test computed: namespaces', () => {
    it('should scope the ui namespace, the i18n scope and the zones to the card', () => {
      const wrapper = mountCard();

      expect(wrapper.vm.localUiNamespace).toEqual(
        'test-namespace.lifecycle-buttons-card'
      );
      expect(wrapper.vm.localI18nScope).toEqual(
        'test-scope.LifecycleButtonsCard'
      );
      expect(wrapper.vm.zoneNames).toEqual({
        prepend: 'test-namespace.lifecycle-buttons-card.prepend',
        append: 'test-namespace.lifecycle-buttons-card.append',
      });
    });
  });

  describe('Test computed: displayedButtons', () => {
    it('should display activation, suspension then deactivation by default', () => {
      const wrapper = mountCard();

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'activation', disable: false, items: activationItems },
        { type: 'suspension', disable: false, items: suspensionItems },
        { type: 'deactivation', disable: false, items: deactivationItems },
      ]);
    });

    it('should follow the configured order', () => {
      const wrapper = mountCard({
        buttons: [
          { type: 'deactivation' },
          { type: 'suspension' },
          { type: 'activation' },
        ],
      });

      expect(wrapper.vm.displayedButtons.map(({ type }) => type)).toEqual([
        'deactivation',
        'suspension',
        'activation',
      ]);
    });

    it('should hide the types missing from the configuration', () => {
      const wrapper = mountCard({ buttons: [{ type: 'suspension' }] });

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'suspension', disable: false, items: suspensionItems },
      ]);
    });

    it('should disable the buttons configured as disabled', () => {
      const wrapper = mountCard({
        buttons: [{ type: 'activation', disable: true }],
      });

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'activation', disable: true, items: activationItems },
      ]);
    });

    it('should disable the buttons whose disable template renders to true with the entity', () => {
      const wrapper = mountCard({
        entity: { locked: true, open: false },
        buttons: [
          { type: 'activation', disable: '{{ entity.locked }}' },
          { type: 'suspension', disable: '{{ entity.open }}' },
        ],
      });

      expect(
        wrapper.vm.displayedButtons.map(({ type, disable }) => ({
          type,
          disable,
        }))
      ).toEqual([
        { type: 'activation', disable: true },
        { type: 'suspension', disable: false },
      ]);
    });

    it('should hide the buttons without menu items', () => {
      const wrapper = mountCard({
        items: { activation: activationItems, suspension: [] },
      });

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'activation', disable: false, items: activationItems },
      ]);
    });

    it('should keep only the first configuration of a duplicated type', () => {
      const wrapper = mountCard({
        buttons: [
          { type: 'suspension', disable: true },
          { type: 'activation' },
          { type: 'suspension' },
        ],
      });

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'suspension', disable: true, items: suspensionItems },
        { type: 'activation', disable: false, items: activationItems },
      ]);
    });

    it('should follow the updates of the menu items', async () => {
      const wrapper = mountCard({ items: {} });

      expect(wrapper.vm.displayedButtons).toEqual([]);

      await wrapper.setProps({ items: { deactivation: deactivationItems } });

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'deactivation', disable: false, items: deactivationItems },
      ]);
    });
  });

  describe('Test computed: isDisplayed', () => {
    it('should be displayed when a button is displayed', () => {
      expect(mountCard().vm.isDisplayed).toEqual(true);
    });

    it('should not be displayed without button nor zone entry', () => {
      expect(mountCard({ items: {} }).vm.isDisplayed).toEqual(false);
    });

    it('should be displayed without button when the prepend zone has entries', () => {
      mockZones['test-namespace.lifecycle-buttons-card.prepend'] = [{}];

      expect(mountCard({ items: {} }).vm.isDisplayed).toEqual(true);
    });

    it('should be displayed without button when the append zone has entries', () => {
      mockZones['test-namespace.lifecycle-buttons-card.append'] = [{}];

      expect(mountCard({ items: {} }).vm.isDisplayed).toEqual(true);
    });
  });

  describe('Test function: onItemClick', () => {
    it('should emit the clicked item and open the dialog of its action', () => {
      const wrapper = mountCard({ entity, actions });

      wrapper.vm.onItemClick({ key: 'activation.immediate' });

      expect(wrapper.emitted('itemClick')).toEqual([
        [{ key: 'activation.immediate' }],
      ]);
      expect(lastEventData('confirmation')).toBeDefined();
    });

    it('should only emit the clicked item when it has no action', () => {
      const wrapper = mountCard({ entity, actions });

      wrapper.vm.onItemClick({ key: 'deactivation.modify' });

      expect(wrapper.emitted('itemClick')).toEqual([
        [{ key: 'deactivation.modify' }],
      ]);
      expect(mockUiEventNext).not.toHaveBeenCalled();
    });
  });

  describe('Test function: runAction', () => {
    it('should open the form dialog of a form action', () => {
      mockTranslations = {
        'actions.suspension.scheduled.FormDialog.content': 'Suspend it?',
      };
      const wrapper = mountCard({
        entity,
        actions,
        instanceId: 'test-instance',
      });

      wrapper.vm.runAction('suspension.scheduled');

      expect(lastEventData('form')).toEqual({
        type: 'open',
        title: 't:actions.suspension.scheduled.FormDialog.title',
        content: 'Suspend it?',
        uiNamespace: 'test-namespace.lifecycle-buttons-card',
        i18nScope:
          'test-scope.LifecycleButtonsCard.actions.suspension.scheduled.FormDialog',
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

    it('should pre-fill the form with the entity when configured', () => {
      const wrapper = mountCard({
        entity,
        actions: {
          'suspension.modify': {
            ...actions['suspension.scheduled'],
            fillFormWithEntity: true,
          },
        },
      });

      wrapper.vm.runAction('suspension.modify');

      expect(lastEventData('form').initialFormData).toEqual(entity);
    });

    it('should pre-fill the form with a deep copy of the entity', () => {
      const nestedEntity = { id: 'account-1', period: { end: 'initial' } };
      const wrapper = mountCard({
        entity: nestedEntity,
        actions: {
          'suspension.modify': {
            ...actions['suspension.scheduled'],
            fillFormWithEntity: true,
          },
        },
      });

      wrapper.vm.runAction('suspension.modify');
      lastEventData('form').initialFormData.period.end = 'edited';

      expect(nestedEntity.period.end).toEqual('initial');
    });

    it('should open the confirmation dialog of a confirmation action', () => {
      const wrapper = mountCard({ entity, actions });

      wrapper.vm.runAction('activation.immediate');

      expect(lastEventData('confirmation')).toEqual({
        type: 'open',
        title: 't:actions.activation.immediate.ConfirmationDialog.title',
        content: '',
        uiNamespace: 'test-namespace.lifecycle-buttons-card',
        i18nScope:
          'test-scope.LifecycleButtonsCard.actions.activation.immediate.ConfirmationDialog',
        onConfirm: expect.any(Function),
      });
    });

    it('should ignore the keys of the object prototype', () => {
      const wrapper = mountCard({ entity, actions });

      wrapper.vm.runAction('constructor');

      expect(mockUiEventNext).not.toHaveBeenCalled();
    });
  });

  describe('Test function: submitAction', () => {
    it('should send the rendered request with the submitted data merged into the entity', async () => {
      const wrapper = mountCard({ entity, actions });
      wrapper.vm.runAction('suspension.scheduled');

      await lastEventData('form').onSubmit({ reason: 'submitted reason' });

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/accounts/account-1/status/suspend',
        data: { reason: 'submitted reason' },
      });
    });

    it('should send a POST request without body by default', async () => {
      const wrapper = mountCard({ entity, actions });
      wrapper.vm.runAction('activation.immediate');

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
      const wrapper = mountCard({ entity, actions });
      wrapper.vm.runAction('activation.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockNotify).toHaveBeenCalledWith({
        type: 'positive',
        message: 'Account activated',
      });
    });

    it('should fall back to the success message of the card', async () => {
      const wrapper = mountCard({ entity, actions });
      wrapper.vm.runAction('activation.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockNotify).toHaveBeenCalledWith({
        type: 'positive',
        message: 't:submitSuccess',
      });
    });

    it('should publish emitOnSubmit with the response body', async () => {
      const wrapper = mountCard({
        entity,
        actions,
        emitOnSubmit: 'account-status-updated',
      });
      wrapper.vm.runAction('activation.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockUiEventNext).toHaveBeenCalledWith({
        key: 'account-status-updated',
        data: { id: 'account-1' },
      });
    });

    it('should notify the error and keep the form dialog open when the request fails', async () => {
      mockRequest.mockRejectedValue(new Error('Bad request'));
      const wrapper = mountCard({
        entity,
        actions,
        emitOnSubmit: 'account-status-updated',
      });
      wrapper.vm.runAction('suspension.scheduled');

      await expect(lastEventData('form').onSubmit({})).rejects.toThrow(
        'Bad request'
      );
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'negative',
        message: 't:submitError',
      });
      expect(lastEventData('account-status-updated')).toBeUndefined();
    });

    it('should notify the error and close the confirmation dialog when a template cannot be rendered', async () => {
      mockRender.mockImplementationOnce(() => {
        throw new Error('Template render error');
      });
      const wrapper = mountCard({ entity, actions });
      wrapper.vm.runAction('activation.immediate');

      await expect(
        lastEventData('confirmation').onConfirm()
      ).resolves.toBeUndefined();
      expect(mockRequest).not.toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'negative',
        message: 't:submitError',
      });
    });

    it('should notify the error and close the confirmation dialog when the request fails', async () => {
      mockRequest.mockRejectedValue(new Error('Bad request'));
      mockTranslations = {
        'actions.activation.immediate.submitError': 'Activation failed',
      };
      const wrapper = mountCard({ entity, actions });
      wrapper.vm.runAction('activation.immediate');

      await expect(
        lastEventData('confirmation').onConfirm()
      ).resolves.toBeUndefined();
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'Activation failed',
      });
    });
  });

  describe('Test prop: immediateActionDelay', () => {
    const immediateActions = {
      'suspension.immediate': {
        dialog: 'confirmation',
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

    it('should render immediateDate five minutes after the submission by default', async () => {
      const wrapper = mountCard({ entity, actions: immediateActions });
      wrapper.vm.runAction('suspension.immediate');
      vi.setSystemTime(new Date('2026-10-29T10:30:00.000Z'));

      await lastEventData('confirmation').onConfirm();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { start: '2026-10-29T10:35:00.000Z' },
        })
      );
    });

    it('should render immediateDate with the configured delay', async () => {
      const wrapper = mountCard({
        entity,
        actions: immediateActions,
        immediateActionDelay: 60,
      });
      wrapper.vm.runAction('suspension.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { start: '2026-10-29T11:00:00.000Z' },
        })
      );
    });

    it('should provide the delay as count to the notifications', async () => {
      const wrapper = mountCard({
        entity,
        actions: immediateActions,
        immediateActionDelay: 60,
      });
      wrapper.vm.runAction('suspension.immediate');

      await lastEventData('confirmation').onConfirm();

      expect(mockTranslateOrDefault).toHaveBeenCalledWith(
        't:submitSuccess',
        'actions.suspension.immediate.submitSuccess',
        { ...entity, count: 60 }
      );
    });
  });

  describe('Test prop: triggerActionOn', () => {
    it('should run the action whose key is carried by the event', () => {
      mountCard({ entity, actions, triggerActionOn: 'lifecycle-action' });

      mockUiEventCallback({
        key: 'lifecycle-action',
        data: { key: 'activation.immediate' },
      });

      expect(lastEventData('confirmation')).toBeDefined();
    });

    it('should ignore the other events', () => {
      mountCard({ entity, actions, triggerActionOn: 'lifecycle-action' });

      mockUiEventCallback({
        key: 'other-event',
        data: { key: 'activation.immediate' },
      });

      expect(mockUiEventNext).not.toHaveBeenCalled();
    });

    it('should ignore the events without key', () => {
      mountCard({ entity, actions, triggerActionOn: 'lifecycle-action' });

      mockUiEventCallback({ key: 'lifecycle-action' });

      expect(mockUiEventNext).not.toHaveBeenCalled();
    });

    it('should ignore the events when not set', () => {
      mountCard({ entity, actions });

      mockUiEventCallback({
        key: 'lifecycle-action',
        data: { key: 'activation.immediate' },
      });

      expect(mockUiEventNext).not.toHaveBeenCalled();
    });

    it('should unsubscribe when unmounted', () => {
      const wrapper = mountCard({ entity, actions });

      wrapper.unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

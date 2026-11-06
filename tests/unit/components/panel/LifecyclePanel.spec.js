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
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LifecyclePanel from '../../../../src/components/panel/LifecyclePanel.vue';
import { useLifecycleActions } from '../../../../src/composables/useLifecycleActions';

const mockRunAction = vi.fn();
const mockT = vi.fn((key) => `t:${key}`);
const mockUi = vi.fn((namespace, component) => ({ namespace, component }));
const mockToDate = vi.fn((value, formatKey) =>
  value ? `${formatKey}:${value}` : ''
);

vi.mock('@linagora/lin-pulsar-core', async () => {
  const { getNestedValue } = await vi.importActual('@linagora/lin-pulsar-core');
  return {
    getNestedValue,
    useCommonMapper: () => ({
      toDate: (...args) => mockToDate(...args),
      toDayJs: (value) => (value ? dayjs(value) : null),
    }),
    useScopedI18n: () => ({ t: (...args) => mockT(...args) }),
    useUiDesign: () => ({ ui: mockUi }),
  };
});

vi.mock('../../../../src/composables/useLifecycleActions', () => ({
  useLifecycleActions: vi.fn(() => ({ runAction: mockRunAction })),
}));

describe('Test component: LifecyclePanel', () => {
  const suspendedEntity = {
    id: 'account-1',
    status: 'SUSPENDED',
    validityPeriod: { start: '2026-01-01T00:00:00Z', end: null },
    suspensionPeriod: {
      start: '2026-04-01T00:00:00Z',
      end: '2026-08-01T00:00:00Z',
    },
    activationAt: '2026-01-02T00:00:00Z',
    daysBeforeDeactivation: null,
  };

  const action = { url: '/accounts/{{ entity.id }}/status' };

  /**
   * Mounts the panel with the given props merged into the default ones.
   * @param props - Props overriding the default ones.
   * @returns The mounted wrapper.
   */
  function mountPanel(props = {}) {
    return shallowMount(LifecyclePanel, {
      props: {
        uiNamespace: 'test-namespace',
        i18nScope: 'test-scope',
        entity: suspendedEntity,
        ...props,
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers().setSystemTime(new Date('2026-05-04T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Test props: defaults', () => {
    it('should use the default values', () => {
      const wrapper = mountPanel({ entity: undefined });

      expect(wrapper.vm.entity).toEqual({});
      expect(wrapper.vm.fields).toEqual({});
      expect(wrapper.vm.enabledStates).toEqual([
        'ACTIVE',
        'SUSPENDED',
        'INACTIVE',
      ]);
      expect(wrapper.vm.deactivationWarningDays).toEqual(15);
      expect(wrapper.vm.immediateActionDelay).toEqual(5);
      expect(wrapper.vm.dateFormatKey).toEqual('application.dateFormat');
      expect(wrapper.vm.actions).toEqual({});
    });
  });

  describe('Test constants: namespaces', () => {
    it('should scope the ui namespace and the i18n scope to the panel', () => {
      const wrapper = mountPanel();

      expect(wrapper.vm.localUiNamespace).toEqual(
        'test-namespace.lifecycle-panel'
      );
      expect(wrapper.vm.localI18nScope).toEqual('test-scope.LifecyclePanel');
    });
  });

  describe('Test composable: useLifecycleActions', () => {
    it('should run the actions with the props of the panel', () => {
      const actions = { 'deactivation.immediate': action };
      const wrapper = mountPanel({
        actions,
        instanceId: 'test-instance',
        immediateActionDelay: 60,
        emitOnSubmit: 'lifecycle-updated',
      });
      const [props, lifecycle, uiNamespace, i18nScope] =
        useLifecycleActions.mock.calls[0];

      expect(props).toMatchObject({
        instanceId: 'test-instance',
        entity: suspendedEntity,
        actions,
        immediateActionDelay: 60,
        emitOnSubmit: 'lifecycle-updated',
      });
      expect(lifecycle.value).toEqual(wrapper.vm.lifecycle);
      expect(uiNamespace).toEqual('test-namespace.lifecycle-panel');
      expect(i18nScope).toEqual('test-scope.LifecyclePanel');
    });
  });

  describe('Test computed: lifecycle', () => {
    it('should read the lifecycle state from the configured fields', () => {
      const wrapper = mountPanel({
        entity: { state: 'ACTIVE' },
        fields: { status: 'state' },
      });

      expect(wrapper.vm.lifecycle.status).toEqual('ACTIVE');
    });
  });

  describe('Test computed: lifecycleUi', () => {
    it('should compute the UI of an enabled status', () => {
      const wrapper = mountPanel();

      expect(wrapper.vm.lifecycleUi).toEqual({
        banners: ['suspended'],
        infoTexts: [],
        actions: ['deactivation.immediate', 'deactivation.scheduled'],
      });
    });

    it('should be null for a status that is not enabled', () => {
      const wrapper = mountPanel({ enabledStates: ['ACTIVE'] });

      expect(wrapper.vm.lifecycleUi).toBeNull();
    });

    it('should be null while the entity is not loaded', () => {
      const wrapper = mountPanel({ entity: {} });

      expect(wrapper.vm.lifecycleUi).toBeNull();
    });

    it('should apply the configured warning days', () => {
      const wrapper = mountPanel({
        entity: {
          ...suspendedEntity,
          validityPeriod: { start: null, end: '2026-05-24T00:00:00Z' },
          daysBeforeDeactivation: 20,
        },
        deactivationWarningDays: 30,
      });

      expect(wrapper.vm.lifecycleUi.banners).toEqual([
        'suspended',
        'deactivationWarning',
      ]);
    });
  });

  describe('Test computed: menuItems', () => {
    it('should keep the configured candidate actions, grouped by lifecycle type', () => {
      const wrapper = mountPanel({
        entity: { ...suspendedEntity, status: 'ACTIVE' },
        actions: {
          'suspension.scheduled': action,
          'deactivation.immediate': action,
          'activation.immediate': action,
        },
      });

      expect(wrapper.vm.menuItems).toEqual({
        suspension: [{ key: 'suspension.scheduled', clickable: true }],
        deactivation: [{ key: 'deactivation.immediate', clickable: true }],
      });
    });

    it('should have no menu item without configured actions', () => {
      const wrapper = mountPanel();

      expect(wrapper.vm.menuItems).toEqual({});
    });
  });

  describe('Test computed: banners', () => {
    it('should give the suspended banner its formatted dates, its end and its configured actions', () => {
      const wrapper = mountPanel({
        actions: { 'reactivation.immediate': action },
        dateFormatKey: 'custom.dateFormat',
      });

      expect(wrapper.vm.banners).toEqual([
        {
          key: 'suspended',
          actions: ['reactivation.immediate'],
          params: {
            date: 'custom.dateFormat:2026-04-01T00:00:00Z',
            endDate: 'custom.dateFormat:2026-08-01T00:00:00Z',
          },
          content: 'contentWithEndDate',
        },
      ]);
    });

    it('should use the default content of a suspension without end', () => {
      const wrapper = mountPanel({
        entity: {
          ...suspendedEntity,
          suspensionPeriod: { start: '2026-04-01T00:00:00Z', end: null },
        },
      });

      expect(wrapper.vm.banners[0]).toMatchObject({
        params: { endDate: '' },
        content: 'content',
      });
    });

    it('should give the deactivation warning banner the days before deactivation as a number', () => {
      const wrapper = mountPanel({
        entity: {
          ...suspendedEntity,
          validityPeriod: { start: null, end: '2026-05-12T00:00:00Z' },
          daysBeforeDeactivation: 8,
        },
        actions: { 'deactivation.modify': action },
      });

      expect(wrapper.vm.banners[1]).toEqual({
        key: 'deactivationWarning',
        actions: ['deactivation.modify'],
        params: {
          date: 'application.dateFormat:2026-05-12T00:00:00Z',
          count: 8,
        },
        content: 'content',
      });
    });

    it('should give the deactivated banner the validity end and its configured actions', () => {
      const wrapper = mountPanel({
        entity: {
          ...suspendedEntity,
          status: 'INACTIVE',
          validityPeriod: { start: null, end: '2026-05-01T00:00:00Z' },
        },
        actions: {
          'revalidation.immediate': action,
          'revalidation.scheduled': action,
        },
      });

      expect(wrapper.vm.banners).toEqual([
        {
          key: 'deactivated',
          actions: ['revalidation.immediate', 'revalidation.scheduled'],
          params: { date: 'application.dateFormat:2026-05-01T00:00:00Z' },
          content: 'content',
        },
      ]);
    });
  });

  describe('Test computed: infoTexts', () => {
    it('should translate the info texts with their formatted date', () => {
      const wrapper = mountPanel({
        entity: {
          ...suspendedEntity,
          status: 'ACTIVE',
          validityPeriod: { start: null, end: '2026-12-01T00:00:00Z' },
          suspensionPeriod: { start: '2026-06-01T00:00:00Z', end: null },
          daysBeforeDeactivation: 30,
        },
      });

      expect(wrapper.vm.infoTexts).toEqual([
        {
          key: 'willDeactivate',
          message: 't:infoTexts.willDeactivate',
          ui: {
            icon: {
              namespace:
                'test-namespace.lifecycle-panel.info-texts.willDeactivate',
              component: 'q-icon',
            },
            label: {
              namespace:
                'test-namespace.lifecycle-panel.info-texts.willDeactivate',
              component: 'q-item-label',
            },
          },
        },
        expect.objectContaining({ key: 'willSuspend' }),
      ]);
      expect(mockT).toHaveBeenCalledWith('infoTexts.willDeactivate', {
        date: 'application.dateFormat:2026-12-01T00:00:00Z',
      });
      expect(mockT).toHaveBeenCalledWith('infoTexts.willSuspend', {
        date: 'application.dateFormat:2026-06-01T00:00:00Z',
      });
    });

    it('should translate the not activated info text without date', () => {
      mountPanel({
        entity: { ...suspendedEntity, status: 'INACTIVE', activationAt: null },
      });

      expect(mockT).toHaveBeenCalledWith('infoTexts.notActivated', {
        date: '',
      });
    });
  });
});

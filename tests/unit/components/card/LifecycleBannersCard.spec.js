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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LifecycleBannersCard from '../../../../src/components/card/LifecycleBannersCard.vue';

const mockT = vi.fn((key) => `t:${key}`);
const mockUi = vi.fn((namespace, component) => ({ namespace, component }));
const mockRenderString = vi.fn(() => ' contentWithEndDate ');
const mockFormatValue = vi.fn((value, formatter) =>
  formatter ? `formatted:${value}` : value
);
const mockUiEventNext = vi.fn();

vi.mock('@linagora/lin-pulsar-core', async () => {
  const { getNestedValue } = await vi.importActual('@linagora/lin-pulsar-core');
  return {
    getNestedValue,
    uiEventSubject: { next: (event) => mockUiEventNext(event) },
    useNunjucks: () => ({ renderString: mockRenderString }),
    useScopedI18n: () => ({ t: (...args) => mockT(...args) }),
    useUiDesign: () => ({ ui: mockUi }),
    useValueFormatter: () => ({ formatValue: mockFormatValue }),
  };
});

describe('Test component: LifecycleBannersCard', () => {
  const entity = {
    id: 'account-1',
    daysBeforeDeactivation: 3,
    suspensionPeriod: { start: '2026-10-01', end: null },
  };

  const dateParam = {
    field: 'suspensionPeriod.start',
    formatter: 'toDate',
    formatOptions: { formatKey: 'application.dateFormat' },
  };

  /**
   * Mounts the component with the given props merged into the default ones.
   * @param props - Props overriding the default ones.
   * @returns The mounted wrapper.
   */
  function mountCard(props = {}) {
    return shallowMount(LifecycleBannersCard, {
      props: {
        uiNamespace: 'test-namespace',
        i18nScope: 'test-scope',
        entity,
        banners: [{ key: 'suspended' }],
        ...props,
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Test props: entity', () => {
    it('should default to an empty object', () => {
      const wrapper = mountCard({ entity: undefined });

      expect(wrapper.vm.entity).toEqual({});
    });
  });

  describe('Test computed: displayedBanners', () => {
    it('should translate the content key of the banner by default', () => {
      const wrapper = mountCard();

      expect(wrapper.vm.displayedBanners[0].content).toEqual(
        't:suspended.content'
      );
      expect(mockT).toHaveBeenCalledWith('suspended.content', {});
      expect(mockRenderString).not.toHaveBeenCalled();
    });

    it('should translate the content key rendered from the content template with the entity', () => {
      const content =
        "{{ 'contentWithEndDate' if entity.suspensionPeriod.end else 'content' }}";
      const wrapper = mountCard({ banners: [{ key: 'suspended', content }] });

      expect(wrapper.vm.displayedBanners[0].content).toEqual(
        't:suspended.contentWithEndDate'
      );
      expect(mockRenderString).toHaveBeenCalledWith(content, { entity });
    });

    it('should provide the formatted entity fields as named parameters of the content', () => {
      mountCard({
        banners: [
          {
            key: 'deactivation-warning',
            params: {
              date: dateParam,
              count: { field: 'daysBeforeDeactivation' },
              endDate: { field: 'suspensionPeriod.end' },
              missing: { field: 'unknown.field' },
            },
          },
        ],
      });

      expect(mockFormatValue).toHaveBeenCalledWith(
        '2026-10-01',
        'toDate',
        dateParam.formatOptions
      );
      expect(mockT).toHaveBeenCalledWith('deactivation-warning.content', {
        date: 'formatted:2026-10-01',
        count: 3,
        endDate: null,
        missing: undefined,
      });
    });

    it('should translate and design the buttons of the actions in configuration order', () => {
      const wrapper = mountCard({
        banners: [
          {
            key: 'suspended',
            actions: ['reactivation.immediate', 'suspension.modify'],
          },
        ],
      });

      expect(wrapper.vm.displayedBanners[0].actions).toEqual([
        {
          key: 'reactivation.immediate',
          label: 't:suspended.actions.reactivation.immediate',
          ui: {
            namespace:
              'test-namespace.lifecycle-banners-card.suspended.actions.reactivation.immediate',
            component: 'q-btn',
          },
        },
        {
          key: 'suspension.modify',
          label: 't:suspended.actions.suspension.modify',
          ui: {
            namespace:
              'test-namespace.lifecycle-banners-card.suspended.actions.suspension.modify',
            component: 'q-btn',
          },
        },
      ]);
    });

    it('should display a duplicated action once', () => {
      const wrapper = mountCard({
        banners: [
          {
            key: 'suspended',
            actions: ['suspension.modify', 'suspension.modify'],
          },
        ],
      });

      expect(
        wrapper.vm.displayedBanners[0].actions.map(({ key }) => key)
      ).toEqual(['suspension.modify']);
    });

    it('should have no button without actions', () => {
      const wrapper = mountCard();

      expect(wrapper.vm.displayedBanners[0].actions).toEqual([]);
    });

    it('should design the banner and its icon under the banner key', () => {
      const wrapper = mountCard();

      expect(wrapper.vm.displayedBanners[0].ui).toEqual({
        banner: {
          namespace: 'test-namespace.lifecycle-banners-card.suspended',
          component: 'q-banner',
        },
        icon: {
          namespace: 'test-namespace.lifecycle-banners-card.suspended',
          component: 'q-icon',
        },
      });
    });

    it('should keep the configuration order and only the first configuration of a duplicated key', () => {
      const wrapper = mountCard({
        banners: [
          { key: 'deactivated' },
          { key: 'suspended', actions: ['suspension.modify'] },
          { key: 'deactivated', actions: ['revalidation.immediate'] },
        ],
      });

      expect(
        wrapper.vm.displayedBanners.map(({ key, actions }) => ({
          key,
          actions: actions.map((action) => action.key),
        }))
      ).toEqual([
        { key: 'deactivated', actions: [] },
        { key: 'suspended', actions: ['suspension.modify'] },
      ]);
    });

    it('should follow the updates of the banners and of the entity', async () => {
      const wrapper = mountCard({
        banners: [{ key: 'suspended', params: { date: dateParam } }],
      });

      await wrapper.setProps({
        entity: { suspensionPeriod: { start: '2026-11-01' } },
      });

      expect(mockT).toHaveBeenLastCalledWith('suspended.content', {
        date: 'formatted:2026-11-01',
      });

      await wrapper.setProps({ banners: [] });

      expect(wrapper.vm.displayedBanners).toEqual([]);
    });
  });

  describe('Test constant: uiProps', () => {
    it('should design the card under the lifecycle banners card namespace', () => {
      const wrapper = mountCard();

      expect(wrapper.vm.uiProps.card).toEqual({
        namespace: 'test-namespace.lifecycle-banners-card',
        component: 'q-card',
      });
    });
  });

  describe('Test function: onActionClick', () => {
    it('should emit the clicked action and publish it on emitOnClick', () => {
      const wrapper = mountCard({ emitOnClick: 'account-lifecycle-action' });

      wrapper.vm.onActionClick('suspension.modify');

      expect(wrapper.emitted('actionClick')).toEqual([
        [{ key: 'suspension.modify' }],
      ]);
      expect(mockUiEventNext).toHaveBeenCalledWith({
        key: 'account-lifecycle-action',
        data: { key: 'suspension.modify' },
      });
    });

    it('should only emit the clicked action when emitOnClick is not set', () => {
      const wrapper = mountCard();

      wrapper.vm.onActionClick('suspension.modify');

      expect(wrapper.emitted('actionClick')).toEqual([
        [{ key: 'suspension.modify' }],
      ]);
      expect(mockUiEventNext).not.toHaveBeenCalled();
    });
  });
});

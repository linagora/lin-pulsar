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

vi.mock('@linagora/lin-pulsar-core', () => ({
  useScopedI18n: () => ({ t: (...args) => mockT(...args) }),
  useUiDesign: () => ({ ui: mockUi }),
}));

describe('Test component: LifecycleBannersCard', () => {
  /**
   * Mounts the component with the given banners.
   * @param banners - The banners to display.
   * @returns The mounted wrapper.
   */
  function mountCard(banners = [{ key: 'suspended' }]) {
    return shallowMount(LifecycleBannersCard, {
      props: {
        uiNamespace: 'test-namespace',
        i18nScope: 'test-scope',
        banners,
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Test computed: displayedBanners', () => {
    it('should translate the default content key without parameters', () => {
      const wrapper = mountCard();

      expect(wrapper.vm.displayedBanners[0].content).toEqual(
        't:suspended.content'
      );
      expect(mockT).toHaveBeenCalledWith('suspended.content', {});
    });

    it('should translate the given content key with the parameters, keeping their type', () => {
      const params = { date: '01/10/2026', count: 3, endDate: '' };
      const wrapper = mountCard([
        { key: 'suspended', content: 'contentWithEndDate', params },
      ]);

      expect(wrapper.vm.displayedBanners[0].content).toEqual(
        't:suspended.contentWithEndDate'
      );
      expect(mockT).toHaveBeenCalledWith(
        'suspended.contentWithEndDate',
        params
      );
    });

    it('should translate and design the buttons of the actions in the given order', () => {
      const wrapper = mountCard([
        {
          key: 'suspended',
          actions: ['reactivation.immediate', 'suspension.modify'],
        },
      ]);

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

    it('should keep the given order and follow the updates of the banners', async () => {
      const wrapper = mountCard([
        { key: 'suspended' },
        { key: 'deactivationWarning' },
      ]);

      expect(wrapper.vm.displayedBanners.map(({ key }) => key)).toEqual([
        'suspended',
        'deactivationWarning',
      ]);

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
});

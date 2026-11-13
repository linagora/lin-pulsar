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
import LifecycleButtonsCard from '../../../../src/components/card/LifecycleButtonsCard.vue';

let mockZones = {};

vi.mock('@linagora/lin-pulsar-core', () => ({
  LinPulsarZoneRenderer: { template: '<div />' },
  useLinPulsarZoneStore: () => ({
    hasZoneEntries: (zone) => (mockZones[zone]?.length ?? 0) > 0,
  }),
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockZones = {};
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
    it('should display activation, suspension then deactivation whatever the order of the items', () => {
      const wrapper = mountCard({
        items: {
          deactivation: deactivationItems,
          suspension: suspensionItems,
          activation: activationItems,
        },
      });

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'activation', items: activationItems },
        { type: 'suspension', items: suspensionItems },
        { type: 'deactivation', items: deactivationItems },
      ]);
    });

    it('should hide the buttons without menu items', () => {
      const wrapper = mountCard({
        items: { activation: activationItems, suspension: [] },
      });

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'activation', items: activationItems },
      ]);
    });

    it('should follow the updates of the menu items', async () => {
      const wrapper = mountCard({ items: {} });

      expect(wrapper.vm.displayedButtons).toEqual([]);

      await wrapper.setProps({ items: { deactivation: deactivationItems } });

      expect(wrapper.vm.displayedButtons).toEqual([
        { type: 'deactivation', items: deactivationItems },
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
});

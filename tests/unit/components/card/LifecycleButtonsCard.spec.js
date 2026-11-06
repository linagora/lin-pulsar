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
  useNunjucks: () => ({
    renderString: (template, context) =>
      template.replace(/\{\{ entity\.(\w+) \}\}/g, (_, property) =>
        String(context.entity[property])
      ),
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
});

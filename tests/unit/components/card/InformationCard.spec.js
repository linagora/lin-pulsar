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
import InformationCard from '../../../../src/components/card/InformationCard.vue';

vi.mock('@linagora/lin-pulsar-core', () => ({
  useUiDesign: () => ({ ui: vi.fn(() => ({})) }),
}));

describe('Test component: InformationCard', () => {
  let wrapper;

  const defaultProps = {
    uiNamespace: 'test-namespace',
    label: 'Test label',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Test computed: displayValue', () => {
    it('should return the value when it is defined', () => {
      wrapper = shallowMount(InformationCard, {
        props: { ...defaultProps, value: 'Test value' },
      });

      expect(wrapper.vm.displayValue).toEqual('Test value');
    });

    it('should return a dash when the value is empty', () => {
      wrapper = shallowMount(InformationCard, {
        props: { ...defaultProps, value: '' },
      });

      expect(wrapper.vm.displayValue).toEqual('-');
    });

    it('should return a dash when the value is not provided', () => {
      wrapper = shallowMount(InformationCard, {
        props: defaultProps,
      });

      expect(wrapper.vm.displayValue).toEqual('-');
    });
  });

  describe('Test computed: jsonData', () => {
    it('should be undefined when the type is not json', () => {
      wrapper = shallowMount(InformationCard, {
        props: { ...defaultProps, value: '{"a":1}' },
      });

      expect(wrapper.vm.jsonData).toBeUndefined();
    });

    it('should be undefined when the value is empty', () => {
      wrapper = shallowMount(InformationCard, {
        props: { ...defaultProps, type: 'json', value: '' },
      });

      expect(wrapper.vm.jsonData).toBeUndefined();
    });

    it('should be undefined when the string is not valid JSON', () => {
      wrapper = shallowMount(InformationCard, {
        props: { ...defaultProps, type: 'json', value: 'not json' },
      });

      expect(wrapper.vm.jsonData).toBeUndefined();
    });

    it('should be undefined when the value is not serializable', () => {
      const circular = { name: 'a1' };
      circular.self = circular;

      wrapper = shallowMount(InformationCard, {
        props: { ...defaultProps, type: 'json', value: circular },
      });

      expect(wrapper.vm.jsonData).toBeUndefined();

      wrapper = shallowMount(InformationCard, {
        props: { ...defaultProps, type: 'json', value: () => 'fn' },
      });

      expect(wrapper.vm.jsonData).toBeUndefined();
    });

    it('should return the object as plain JSON data', () => {
      wrapper = shallowMount(InformationCard, {
        props: {
          ...defaultProps,
          type: 'json',
          value: { name: 'a1', count: 2, ok: true, none: null },
        },
      });

      expect(wrapper.vm.jsonData).toEqual({
        name: 'a1',
        count: 2,
        ok: true,
        none: null,
      });
    });

    it('should parse a JSON string', () => {
      wrapper = shallowMount(InformationCard, {
        props: { ...defaultProps, type: 'json', value: '[1,"two"]' },
      });

      expect(wrapper.vm.jsonData).toEqual([1, 'two']);
    });
  });
});

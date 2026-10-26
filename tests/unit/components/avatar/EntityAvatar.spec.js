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

import { Avatar } from '@dicebear/core';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isProxy, reactive } from 'vue';
import EntityAvatar from '../../../../src/components/avatar/EntityAvatar.vue';

const { mockRender, mockUi, mockUseScopedI18n, mockLoadDiceBearStyle } =
  vi.hoisted(() => {
    const translateOrDefault = vi.fn((defaultValue) => defaultValue);

    return {
      mockRender: vi.fn((template) => template),
      mockUi: vi.fn(() => ({})),
      mockUseScopedI18n: vi.fn(() => ({ translateOrDefault })),
      mockLoadDiceBearStyle: vi.fn(async () => ({})),
    };
  });

vi.mock('@dicebear/core', () => ({
  // Must use `function` (not arrow) so `new Avatar(...)` returns this object.
  Avatar: vi.fn().mockImplementation(function (_style, opts) {
    return { toDataUri: () => `data:image/svg+xml;base64,MOCK_${opts.seed}` };
  }),
}));

vi.mock('../../../../src/services/diceBearLoaderService', () => ({
  loadDiceBearStyle: mockLoadDiceBearStyle,
}));

vi.mock('@linagora/lin-pulsar-core', () => ({
  useNunjucks: () => ({ renderString: mockRender }),
  useScopedI18n: mockUseScopedI18n,
  useUiDesign: () => ({ ui: mockUi }),
}));

describe('Test component: EntityAvatar', () => {
  let wrapper;

  const defaultProps = {
    uiNamespace: 'test-namespace',
    i18nScope: 'test-scope',
    instanceId: 'test-instance',
    entity: { uid: 'john' },
    avatarOptions: { seed: ['{{ entity.uid }}'], style: 'adventurer' },
  };

  /**
   * Mounts the component with the default props merged with the given overrides.
   * @param props - Props overriding the default ones.
   * @returns The mounted wrapper.
   */
  function mountComponent(props = {}) {
    return shallowMount(EntityAvatar, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          // Renders the default slot so the inner image and fallback icon are testable.
          QAvatar: { template: '<div><slot /></div>' },
          QIcon: true,
        },
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mountComponent();
  });

  describe('Test computed: localUiNamespace', () => {
    it('should append .entity-avatar to the provided uiNamespace', () => {
      expect(wrapper.vm.localUiNamespace).toBe('test-namespace.entity-avatar');
    });

    it('should fall back to the instanceId when no uiNamespace is provided', () => {
      wrapper = mountComponent({ uiNamespace: undefined });

      expect(wrapper.vm.localUiNamespace).toBe('test-instance.entity-avatar');
    });

    it('should use the component name alone when neither uiNamespace nor instanceId is provided', () => {
      wrapper = mountComponent({
        uiNamespace: undefined,
        instanceId: undefined,
      });

      expect(wrapper.vm.localUiNamespace).toBe('entity-avatar');
    });
  });

  describe('Test computed: localI18nScope', () => {
    it('should append .EntityAvatar to the provided i18nScope', () => {
      expect(wrapper.vm.localI18nScope).toBe('test-scope.EntityAvatar');
    });

    it('should fall back to the instanceId when no i18nScope is provided', () => {
      wrapper = mountComponent({ i18nScope: undefined });

      expect(wrapper.vm.localI18nScope).toBe('test-instance.EntityAvatar');
    });

    it('should use the component name alone when neither i18nScope nor instanceId is provided', () => {
      wrapper = mountComponent({ i18nScope: undefined, instanceId: undefined });

      expect(wrapper.vm.localI18nScope).toBe('EntityAvatar');
    });
  });

  describe('Test computed: uiProps', () => {
    it('should retrieve the q-avatar and q-icon design props under the local namespace', () => {
      expect(mockUi).toHaveBeenCalledWith(
        'test-namespace.entity-avatar',
        'q-avatar'
      );
      expect(mockUi).toHaveBeenCalledWith(
        'test-namespace.entity-avatar',
        'q-icon'
      );
    });
  });

  describe('Test avatar generation', () => {
    it('should generate a data URI from the entity seed', async () => {
      await flushPromises();

      expect(wrapper.vm.diceBearSrc).toMatch(/^data:image\/svg\+xml/);
    });

    it('should render seed templates with the entity context', async () => {
      await flushPromises();

      expect(mockRender).toHaveBeenCalledWith('{{ entity.uid }}', {
        entity: { uid: 'john' },
      });
    });

    it('should not generate an avatar while the entity is not resolved', async () => {
      wrapper.unmount();
      vi.clearAllMocks();
      wrapper = mountComponent({ entity: null });

      await flushPromises();

      expect(mockLoadDiceBearStyle).not.toHaveBeenCalled();
      expect(wrapper.vm.diceBearSrc).toBeUndefined();
    });

    it('should pass plain style options to DiceBear when avatarOptions is reactive', async () => {
      wrapper.unmount();
      vi.clearAllMocks();
      wrapper = mountComponent({
        avatarOptions: reactive({
          seed: ['{{ entity.uid }}'],
          style: 'adventurer',
          styleOptions: { backgroundColor: ['b6e3f4'] },
        }),
      });

      await flushPromises();

      expect(Avatar).toHaveBeenCalledOnce();
      const [, options] = Avatar.mock.lastCall;
      expect(isProxy(options.backgroundColor)).toBe(false);
      expect(() => structuredClone(options)).not.toThrow();
    });

    it('should regenerate the avatar when the entity changes', async () => {
      await flushPromises();
      expect(Avatar).toHaveBeenCalledTimes(1);

      await wrapper.setProps({ entity: { uid: 'jane' } });
      await flushPromises();

      expect(Avatar).toHaveBeenCalledTimes(2);
    });

    it('should not generate an avatar when avatarOptions is not provided', async () => {
      wrapper.unmount();
      vi.clearAllMocks();
      wrapper = mountComponent({ avatarOptions: undefined });

      await flushPromises();

      expect(mockLoadDiceBearStyle).not.toHaveBeenCalled();
      expect(wrapper.vm.diceBearSrc).toBeUndefined();
    });

    it('should hold undefined when the style loader rejects', async () => {
      mockLoadDiceBearStyle.mockRejectedValueOnce(new Error('Network error'));
      wrapper = mountComponent();

      await flushPromises();

      expect(wrapper.vm.diceBearSrc).toBeUndefined();
    });
  });

  describe('Test rendering', () => {
    it('should render the generated image and no fallback icon', async () => {
      await flushPromises();

      expect(wrapper.find('[data-cy="entity-avatar_img"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="entity-avatar_icon"]').exists()).toBe(
        false
      );
    });

    it('should render the fallback icon when no avatar is generated', async () => {
      wrapper = mountComponent({ avatarOptions: undefined });

      await flushPromises();

      expect(wrapper.find('[data-cy="entity-avatar_img"]').exists()).toBe(
        false
      );
      expect(wrapper.find('[data-cy="entity-avatar_icon"]').exists()).toBe(
        true
      );
    });

    it('should set the alt text on the generated image', async () => {
      await flushPromises();

      expect(
        wrapper.find('[data-cy="entity-avatar_img"]').attributes('alt')
      ).toBe('Avatar');
    });
  });
});

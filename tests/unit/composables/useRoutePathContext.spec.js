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

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { useRoutePathContext } from '../../../src/composables/useRoutePathContext';

/**
 * Mounts a component exposing the context built by the composable.
 * @param plugins - The plugins of the app, such as a router.
 * @returns The mounted wrapper, whose `vm.context` is the composable result.
 */
function mountWithContext(plugins) {
  const component = defineComponent({
    setup() {
      return { context: useRoutePathContext() };
    },
    render: () => h('div'),
  });

  return mount(component, { global: { plugins } });
}

/**
 * Creates a router holding a route nested under a structure.
 * @returns The router.
 */
function createNestedRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/structures/:structureId/hierarchies/:id',
        component: { render: () => null },
      },
    ],
  });
}

describe('Test composable: useRoutePathContext', () => {
  it('should give the params and the query of the current route', async () => {
    const router = createNestedRouter();
    await router.push('/structures/7/hierarchies/42?tab=entities');

    const wrapper = mountWithContext([router]);

    expect(wrapper.vm.context).toEqual({
      params: { structureId: '7', id: '42' },
      query: { tab: 'entities' },
    });
  });

  it('should URI-encode each value so that it stays a single path segment', async () => {
    const router = createNestedRouter();
    await router.push(
      '/structures/a%2Fb/hierarchies/42?groupId=x%3Fy&tags=a%23b&tags=c&flag'
    );

    const wrapper = mountWithContext([router]);

    expect(wrapper.vm.context).toEqual({
      params: { structureId: 'a%2Fb', id: '42' },
      query: { groupId: 'x%3Fy', tags: ['a%23b', 'c'], flag: null },
    });
  });

  it('should follow the navigation to another route', async () => {
    const router = createNestedRouter();
    await router.push('/structures/7/hierarchies/42');
    const wrapper = mountWithContext([router]);

    await router.push('/structures/8/hierarchies/43');

    expect(wrapper.vm.context.params).toEqual({ structureId: '8', id: '43' });
  });
});

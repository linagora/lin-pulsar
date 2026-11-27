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

// Apart from BaseLayout.spec.js, which mocks vue-router: the page key is tested under a real router.
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h, onMounted } from 'vue';
import { RouterView, createMemoryHistory, createRouter } from 'vue-router';
import BaseLayout from '../../../src/layouts/BaseLayout.vue';

vi.mock('@linagora/lin-pulsar-core', () => ({
  LinPulsarZoneRenderer: { template: '<div />' },
  useLinPulsarUiStore: () => ({ mainNavigationItems: [] }),
  useScopedI18n: () => ({ t: (key) => key }),
  useUiDesign: () => ({ ui: vi.fn(() => ({})) }),
}));

const mounts = [];

const SlotStub = { template: '<div><slot /></div>' };

const Page = {
  setup(_, { attrs }) {
    onMounted(() => mounts.push(attrs.label));

    return () => h('div');
  },
};

/**
 * Mount the layout under a router holding two modules, the way module-page-route declares them: one page per module,
 * identified by its instanceId.
 * @returns The router of the mounted layout.
 */
async function mountLayout() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/structures',
        component: BaseLayout,
        children: [
          {
            path: ':id',
            component: Page,
            props: (route) => ({ label: `structure ${route.params.id}` }),
            meta: { instanceId: 'moduleStructureDetailsPage' },
          },
        ],
      },
      {
        path: '/structures/:structureId/hierarchies',
        component: BaseLayout,
        children: [
          {
            path: ':id',
            component: Page,
            props: (route) => ({
              label: `hierarchy ${route.params.structureId}/${route.params.id}`,
            }),
            meta: { instanceId: 'moduleHierarchyDetailsPage' },
          },
        ],
      },
    ],
  });

  router.push('/structures/1');
  await router.isReady();
  // The header of the layout is left out: its components need Quasar.
  mount(
    { render: () => h(RouterView) },
    {
      global: {
        plugins: [router],
        stubs: {
          QLayout: SlotStub,
          QPageContainer: SlotStub,
          QHeader: true,
          HeaderProfile: true,
          NavigationMenu: true,
        },
      },
    }
  );
  await flushPromises();

  return router;
}

describe('Test layout: BaseLayout page key', () => {
  beforeEach(() => {
    mounts.length = 0;
  });

  it('should mount the page again when only the identifier of its route changes', async () => {
    const router = await mountLayout();

    await router.push('/structures/7');
    await flushPromises();

    expect(mounts).toEqual(['structure 1', 'structure 7']);
  });

  it('should mount the page again when only a parent parameter of its route changes', async () => {
    const router = await mountLayout();

    await router.push('/structures/1/hierarchies/3');
    await flushPromises();
    await router.push('/structures/2/hierarchies/3');
    await flushPromises();

    expect(mounts).toEqual(['structure 1', 'hierarchy 1/3', 'hierarchy 2/3']);
  });

  it('should keep the page when only the query string of its route changes', async () => {
    const router = await mountLayout();

    await router.push('/structures/1?tab=contact');
    await flushPromises();

    expect(mounts).toEqual(['structure 1']);
  });
});

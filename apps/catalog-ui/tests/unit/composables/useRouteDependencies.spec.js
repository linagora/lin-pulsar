/*
 * Copyright (C) 2026 Linagora
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General
 * Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option)
 * any later version, provided you comply with the Additional Terms applicable for LinID Identity Manager software by
 * LINAGORA pursuant to Section 7 of the GNU Affero General Public License, subsections (b), (c), and (e), pursuant to
 * which these Appropriate Legal Notices must notably (i) retain the display of the "LinID™" trademark/logo at the top
 * of the interface window, the display of the “You are using the Open Source and free version of LinID™, powered by
 * Linagora © 2009–2013. Contribute to LinID R&D by subscribing to an Enterprise offer!” infobox and in the e-mails
 * sent with the Program, notice appended to any type of outbound messages (e.g. e-mail and meeting requests) as well
 * as in the LinID Identity Manager user interface, (ii) retain all hypertext links between LinID Identity Manager
 * and https://linid.org/, as well as between LINAGORA and LINAGORA.com, and (iii) refrain from infringing LINAGORA
 * intellectual property rights over its trademarks and commercial brands. Other Additional Terms apply, see
 * <http://www.linagora.com/licenses/> for more details.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License and its applicable Additional Terms for
 * LinID Identity Manager along with this program. If not, see <http://www.gnu.org/licenses/> for the GNU Affero
 * General Public License version 3 and <http://www.linagora.com/licenses/> for the Additional Terms applicable to the
 * LinID Identity Manager software.
 */

import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useRouteDependencies } from '../../../src/composables/useRouteDependencies';

/**
 * Builds the reactive check for the given context and dependency paths.
 * @param context - The context the dependency paths are resolved against.
 * @param dependencies - Dot-notation paths of the values the route depends on.
 * @returns The `areRouteDependenciesSatisfied` computed.
 */
function satisfied(context, dependencies) {
  return useRouteDependencies(context, dependencies)
    .areRouteDependenciesSatisfied;
}

describe('Test composable: useRouteDependencies', () => {
  describe('Test computed: areRouteDependenciesSatisfied', () => {
    it('should be satisfied when there is no dependency', () => {
      expect(satisfied({ entity: {} }, []).value).toBe(true);
    });

    it('should be satisfied when every dependency holds a value, including 0 and false', () => {
      const context = { entity: { id: 0, active: false, tags: ['a'] } };

      expect(
        satisfied(context, ['entity.id', 'entity.active', 'entity.tags']).value
      ).toBe(true);
    });

    it.each([
      ['a null value', { entity: { id: null } }],
      ['a missing path', { entity: {} }],
      ['a blank string', { entity: { id: '  ' } }],
      ['an empty array', { entity: { id: [] } }],
    ])(
      'should not be satisfied when a dependency holds %s',
      (_label, context) => {
        expect(satisfied(context, ['entity.id']).value).toBe(false);
      }
    );

    it('should follow the context updates', () => {
      const context = ref({ entity: {} });
      const isSatisfied = satisfied(context, ['entity.id']);

      expect(isSatisfied.value).toBe(false);

      context.value = { entity: { id: '123' } };

      expect(isSatisfied.value).toBe(true);
    });
  });
});

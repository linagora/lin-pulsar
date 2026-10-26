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

import { getNestedValue } from '@linagora/lin-pulsar-core';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

/**
 * Tells whether a dependency value is usable to build a destination. `null`, `undefined`, blank
 * strings and empty arrays count as missing; every other value, including `0` and `false`, is a
 * value.
 * @param value - The value read at the dependency path.
 * @returns True when the dependency holds a non-empty value.
 */
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

/**
 * Tracks whether every declared route dependency holds a non-empty value in the given context, so
 * that a route template can be rendered to a meaningful destination.
 * @param context - The context the dependency paths are resolved against, as a ref or getter so
 *   the check follows its updates.
 * @param dependencies - Dot-notation paths of the values the route depends on, as a ref or getter.
 * @returns An object exposing the reactive `areRouteDependenciesSatisfied` check.
 */
export function useRouteDependencies(
  context: MaybeRefOrGetter<Record<string, unknown>>,
  dependencies: MaybeRefOrGetter<string[]>
): {
  /**
   * Whether every declared dependency holds a non-empty value in the context.
   */
  areRouteDependenciesSatisfied: ComputedRef<boolean>;
} {
  const areRouteDependenciesSatisfied = computed(() =>
    toValue(dependencies)
      .map((dependency) => getNestedValue(toValue(context), dependency))
      .every(hasValue)
  );

  return { areRouteDependenciesSatisfied };
}

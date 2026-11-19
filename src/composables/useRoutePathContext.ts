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

import type { ComputedRef } from 'vue';
import { computed } from 'vue';
import type { LocationQuery, RouteParams } from 'vue-router';
import { useRoute } from 'vue-router';

/**
 * Context used to render a templated path of a page, with the values of the route URI-encoded.
 */
export interface RoutePathContext {
  /** Parameters of the current route. */
  params: RouteParams;
  /** Query string of the current route. */
  query: LocationQuery;
}

/**
 * URI-encodes a value of the route, each item of an array being encoded on its own.
 * @param value - A parameter or a query value of the route.
 * @returns The encoded value; a `null` value, such as a query flag without value, is kept.
 */
function encodeRouteValue<T>(value: T): T {
  if (typeof value === 'string') {
    return encodeURIComponent(value) as T;
  }

  return (Array.isArray(value) ? value.map(encodeRouteValue) : value) as T;
}

/**
 * URI-encodes the values of the parameters or of the query string of the route.
 * @param values - The parameters or the query string of the route, decoded by the router.
 * @returns A copy with each value encoded.
 */
function encodeRouteValues<T extends RouteParams | LocationQuery>(
  values: T
): T {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, encodeRouteValue(value)])
  ) as T;
}

/**
 * Builds the context used to render a templated path of a page, such as a `parentPath` like
 * `"/structures/{{ params.structureId }}/hierarchies"`, from the route of the page: its `params` and its `query`.
 *
 * The router gives these values decoded, so each one is URI-encoded (`encodeURIComponent`) to stay a single path
 * segment: a value holding `/`, `?` or `#` would otherwise change the target route. Use `useApiEndpointContext` for
 * an `apiEndpoint` instead, whose context the entity service of `lin-pulsar-core` encodes itself.
 * @returns The encoded context of the current route, updated when the route changes.
 */
export function useRoutePathContext(): ComputedRef<RoutePathContext> {
  const route = useRoute();

  return computed(() => ({
    params: encodeRouteValues(route.params),
    query: encodeRouteValues(route.query),
  }));
}

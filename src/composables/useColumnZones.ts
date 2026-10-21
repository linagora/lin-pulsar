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

import {
  getNestedValue,
  useLinidZoneStore,
} from '@linagora/linid-im-front-corelib';
import type { GenericTableColumn } from '../types/ModuleGenericTablePageOptions';

/**
 * Shares the column zone naming and the cell entity resolution between the components rendering
 * table column zones, so a zone registered for a column behaves identically wherever the column
 * is rendered.
 * @param uiNamespace - Getter of the UI namespace prefixing the zone names.
 * @returns The column zone helpers.
 */
export function useColumnZones(uiNamespace: () => string) {
  const linidZoneStore = useLinidZoneStore();

  /**
   * Returns the zone identifier hosting the custom rendering of a column.
   * @param name - The column name.
   * @returns The zone identifier.
   */
  const columnZone = (name: string) => `${uiNamespace()}.columns.${name}`;

  /**
   * Whether a component is registered in the zone of a column.
   * @param name - The column name.
   * @returns True when the column zone holds at least one entry.
   */
  const hasColumnZone = (name: string) =>
    linidZoneStore.hasZoneEntries(columnZone(name));

  /**
   * Entities rendered by the zone of a column for a row. A single-item column renders the row
   * itself; a multi-item column renders each item of the array resolved from `itemPath` against
   * `{ entity: row }`, and a value that is not an array renders nothing.
   * @param column - The column definition.
   * @param row - The row entity.
   * @returns The entities rendered by the column zone.
   */
  const columnEntities = (
    column: GenericTableColumn,
    row: Record<string, unknown>
  ): unknown[] => {
    if (!column.multiItem) {
      return [row];
    }

    const items = getNestedValue({ entity: row }, column.itemPath ?? '');
    return Array.isArray(items) ? items : [];
  };

  return { columnZone, hasColumnZone, columnEntities };
}

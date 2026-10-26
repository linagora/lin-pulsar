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

import type {
  LinPulsarFilter,
  LinPulsarFilterValue,
  LinPulsarQIconProps,
  LinPulsarQItemProps,
  LinPulsarQItemSectionProps,
  LinPulsarQListProps,
  LinPulsarQSeparatorProps,
} from '@linagora/lin-pulsar-core';
import type { CommonComponentProps } from './common';

/**
 * Props for the LinPulsarFilterPanel component.
 */
export interface LinPulsarFilterPanelProps extends CommonComponentProps {
  /**
   * Available filters to display in the navigation list.
   */
  filters: LinPulsarFilter[];
  /**
   * Identifier of the currently selected filter (v-model:selected).
   * When it does not match any filter in `filters`, the first filter is selected instead.
   */
  selected: string;
}

/**
 * Defines the UI properties for each filter type, used to resolve the per-type icon.
 */
export type LinPulsarFilterPanelUIPropsTypes = Record<
  string,
  {
    /**
     * The UI properties for the displayed icon.
     */
    icon: LinPulsarQIconProps;
  }
>;

/**
 * UI props for the LinPulsarFilterPanel component.
 */
export interface LinPulsarFilterPanelUIProps {
  /**
   * The UI properties for the filter navigation list.
   */
  list: LinPulsarQListProps;
  /**
   * The UI properties for each filter item.
   */
  item: LinPulsarQItemProps;
  /**
   * The UI properties for the filter item icon, keyed by filter type.
   */
  types: LinPulsarFilterPanelUIPropsTypes;
  /**
   * The UI properties for the icon item section (avatar).
   */
  iconSection: LinPulsarQItemSectionProps;
  /**
   * The UI properties for the label item section.
   */
  labelSection: LinPulsarQItemSectionProps;
  /**
   * The UI properties for the icon displayed in the title bar.
   */
  titleIcon: LinPulsarQIconProps;
  /**
   * The UI properties for the horizontal separator below the title.
   */
  titleSeparator: LinPulsarQSeparatorProps;
  /**
   * The UI properties for the vertical separator between the filter list and the editor.
   */
  contentSeparator: LinPulsarQSeparatorProps;
}

/**
 * Base search payload for filter panel components. Can be extended to add filter-specific fields.
 */
export interface LinPulsarFilterPanelSearchPayload {
  /**
   * The field name targeted by the filter.
   */
  field: string;
  /**
   * The list of filter values to apply.
   */
  values: LinPulsarFilterValue[];
}

/**
 * Generic search output type for filter panel components.
 * Specialize with a payload type extending `LinPulsarFilterPanelSearchPayload` to add filter-specific fields.
 */
export type LinPulsarFilterPanelSearchOutputs<
  T extends LinPulsarFilterPanelSearchPayload =
    LinPulsarFilterPanelSearchPayload,
> = {
  (e: 'search', payload: T): void;
};

/**
 * Defines the events emitted by the LinPulsarFilterPanel component.
 */
export type LinPulsarFilterPanelOutputs = {
  (e: 'update:selected', filterName: string): void;
};

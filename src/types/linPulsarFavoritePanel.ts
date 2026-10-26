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

import type {
  LinPulsarFilter,
  LinPulsarFilterSet,
  LinPulsarQBtnProps,
  LinPulsarQIconProps,
  LinPulsarQItemProps,
  LinPulsarQItemSectionProps,
  LinPulsarQListProps,
  LinPulsarQSeparatorProps,
} from '@linagora/lin-pulsar-core';
import type { CommonComponentProps } from './common';

/**
 * Props for the LinPulsarFavoritePanel component.
 */
export interface LinPulsarFavoritePanelProps extends CommonComponentProps {
  /**
   * Available favorites to display in the navigation list.
   */
  favorites: LinPulsarFilterSet[];
  /**
   * Filters used.
   */
  filters: LinPulsarFilter[];
}

/**
 * UI props for the LinPulsarFavoritePanel component.
 */
export interface LinPulsarFavoritePanelUIProps {
  /**
   * The UI properties for the filter navigation list.
   */
  list: LinPulsarQListProps;
  /**
   * The UI properties for each filter item.
   */
  item: LinPulsarQItemProps;
  /**
   * The UI properties for the icon item section (avatar).
   */
  iconSection: LinPulsarQItemSectionProps;
  /**
   * The UI properties for the icon in icon item section (avatar).
   */
  icon: LinPulsarQIconProps;
  /**
   * The UI properties for the no-data icon item section (avatar).
   */
  noDataIconSection: LinPulsarQItemSectionProps;
  /**
   The UI properties for the no-data label item section.
   */
  noDataLabelSection: LinPulsarQItemSectionProps;
  /**
   * The UI properties for the  no-data icon in icon item section (avatar).
   */
  noDataIcon: LinPulsarQIconProps;
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
   * The UI properties for the rename item section.
   */
  renameSection: LinPulsarQItemSectionProps;
  /**
   * The UI properties for the rename button.
   */
  renameButton: LinPulsarQBtnProps;
  /**
   * The UI properties for the override item section.
   */
  overrideSection: LinPulsarQItemSectionProps;
  /**
   * The UI properties for the override button.
   */
  overrideButton: LinPulsarQBtnProps;
  /**
   * The UI properties for the delete item section.
   */
  deleteSection: LinPulsarQItemSectionProps;
  /**
   * The UI properties for the delete button.
   */
  deleteButton: LinPulsarQBtnProps;
  /**
   * The UI properties for the create button.
   */
  createButton: LinPulsarQBtnProps;
}

/**
 * Defines the events emitted by the LinPulsarFavoritePanel component.
 */
export type LinPulsarFavoritePanelOutputs = {
  (e: 'apply', favorite: LinPulsarFilterSet): void;
  (e: 'delete', favorite: LinPulsarFilterSet): void;
  (e: 'rename', favorite: LinPulsarFilterSet): void;
  (e: 'create'): void;
  (e: 'override', favorite: LinPulsarFilterSet): void;
};

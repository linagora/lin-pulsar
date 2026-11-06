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

import type { DropdownClickPayload, MenuItem } from '@linagora/lin-pulsar-core';
import type { CommonComponentProps } from './common';

/**
 * Types of the lifecycle buttons, in display order.
 */
export const LIFECYCLE_BUTTON_TYPES = [
  'activation',
  'suspension',
  'deactivation',
] as const;

/**
 * Type of a lifecycle button, each type being rendered as its own dropdown.
 */
export type LifecycleButtonType = (typeof LIFECYCLE_BUTTON_TYPES)[number];

/**
 * Props for the LifecycleButtonsCard component.
 */
export interface LifecycleButtonsCardProps extends CommonComponentProps {
  /**
   * I18n scope for localizing the component.
   */
  i18nScope: string;

  /**
   * Instance identifier forwarded to the components hosted by the zones.
   */
  instanceId?: string;

  /**
   * Entity forwarded to the components hosted by the zones.
   * @default {}
   */
  entity?: Record<string, unknown>;

  /**
   * Menu items of each button, indexed by button type. A button without items is not displayed.
   */
  items: Partial<Record<LifecycleButtonType, MenuItem[]>>;
}

/**
 * Outputs (events) emitted by the LifecycleButtonsCard component.
 */
export interface LifecycleButtonsCardOutputs {
  /**
   * Emitted when a menu item of any button is clicked.
   */
  itemClick: [DropdownClickPayload];
}

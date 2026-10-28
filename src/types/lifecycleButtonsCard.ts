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
  DropdownClickPayload,
  LinPulsarAttributeConfiguration,
  MenuItem,
} from '@linagora/lin-pulsar-core';
import type { CommonComponentProps } from './common';

/**
 * Type of a lifecycle button, each type being rendered as its own dropdown.
 */
export type LifecycleButtonType = 'activation' | 'suspension' | 'deactivation';

/**
 * Display configuration of a lifecycle button.
 */
export interface LifecycleButton {
  /**
   * Type of the button, selecting its menu items, design namespace and translations.
   */
  type: LifecycleButtonType;

  /**
   * Whether the button is disabled. Either a boolean, or a Nunjucks template rendered with `entity`
   * that disables the button when it renders to `true`, for example
   * `"{{ entity.status == 'SUSPENDED' }}"`.
   * @default false
   */
  disable?: string | boolean;
}

/**
 * Action run when a menu item is clicked: a dialog is opened, then the configured request is sent.
 */
export interface LifecycleAction {
  /**
   * Dialog opened before sending the request: a confirmation dialog, or a form dialog collecting
   * the `formFields`.
   */
  dialog: 'confirmation' | 'form';

  /**
   * Request URL, defined as a Nunjucks template rendered with `entity`, the entity merged with the
   * submitted form data, and `immediateDate`, the ISO date `immediateActionDelay` minutes after the
   * submission.
   */
  url: string;

  /**
   * HTTP method used to send the request.
   * @default 'POST'
   */
  method?: 'DELETE' | 'POST' | 'PUT';

  /**
   * JSON payload sent as the request body, every nested string property being a Nunjucks template
   * rendered like `url`. Not sent when empty.
   * @default {}
   */
  body?: Record<string, unknown>;

  /**
   * Form fields of the form dialog. Ignored by the confirmation dialog.
   * @default []
   */
  formFields?: LinPulsarAttributeConfiguration[];

  /**
   * Whether the form dialog is pre-filled with the entity values. Ignored by the confirmation dialog.
   * @default false
   */
  fillFormWithEntity?: boolean;
}

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
   * Entity targeted by the actions, provided to their templates and translations, and to the
   * `disable` templates of the buttons, and forwarded to the components hosted by the zones.
   * @default {}
   */
  entity?: Record<string, unknown>;

  /**
   * Menu items of each button, indexed by button type. A button without items is not displayed.
   */
  items: Partial<Record<LifecycleButtonType, MenuItem[]>>;

  /**
   * Buttons in display order. Only the first configuration of each type is kept.
   * @default [{ type: 'activation' }, { type: 'suspension' }, { type: 'deactivation' }]
   */
  buttons?: LifecycleButton[];

  /**
   * Actions run by the menu items, indexed by menu item key, for example `suspension.immediate`. A
   * menu item without action only emits `itemClick`.
   * @default {}
   */
  actions?: Record<string, LifecycleAction>;

  /**
   * When set, the card publishes an event with this key on `uiEventSubject` after a successful
   * action, with the response body as data, for example to reload the entity of a details page
   * through its `reloadDetailsOn` option.
   */
  emitOnSubmit?: string;

  /**
   * Delay in minutes between the submission of an action and its `immediateDate`, the start date of
   * the immediate actions, so that it is not already in the past when the API receives it. Also
   * provided as `count` to the notifications of the actions.
   * @default 5
   */
  immediateActionDelay?: number;

  /**
   * When set, the card runs the action whose key is the `key` of the data of the events published
   * with this key on `uiEventSubject`, so that other components, such as banners, can run the
   * configured actions. The dropdowns are not involved: the action runs even when its menu item is
   * not displayed or its dropdown is disabled.
   */
  triggerActionOn?: string;
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

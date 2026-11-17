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

import type { LinPulsarAttributeConfiguration } from '@linagora/lin-pulsar-core';
import type { CommonComponentProps } from './common';

/**
 * Key of a lifecycle action, its first segment being the lifecycle operation and its second one the moment it applies.
 */
export type LifecycleActionKey =
  | 'activation.immediate'
  | 'activation.scheduled'
  | 'suspension.immediate'
  | 'suspension.scheduled'
  | 'suspension.modify'
  | 'deactivation.immediate'
  | 'deactivation.scheduled'
  | 'deactivation.modify'
  | 'reactivation.immediate'
  | 'revalidation.immediate'
  | 'revalidation.scheduled';

/**
 * Key of a lifecycle banner.
 */
export type LifecycleBannerKey =
  'suspended' | 'deactivated' | 'deactivationWarning';

/**
 * Key of a lifecycle info text.
 */
export type LifecycleInfoTextKey =
  'willDeactivate' | 'willSuspend' | 'notActivated';

/**
 * Entity paths of the lifecycle data, in dot notation.
 */
export interface LifecycleFieldMapping {
  /**
   * Path of the status: `ACTIVE`, `SUSPENDED` or `INACTIVE`.
   */
  status: string;

  /**
   * Path of the start of the validity period.
   */
  validityStart: string;

  /**
   * Path of the end of the validity period.
   */
  validityEnd: string;

  /**
   * Path of the start of the suspension period.
   */
  suspensionStart: string;

  /**
   * Path of the end of the suspension period.
   */
  suspensionEnd: string;

  /**
   * Path of the activation date, unset while the entity has never been activated.
   */
  activationAt: string;

  /**
   * Path of the number of days before the end of the validity period, computed from `validityEnd` when the entity
   * does not provide it.
   */
  daysBeforeDeactivation: string;
}

/**
 * Lifecycle state of an entity, read from the paths of a {@link LifecycleFieldMapping}.
 */
export interface LifecycleState {
  /**
   * Status of the entity.
   */
  status: unknown;

  /**
   * Start of the validity period.
   */
  validityStart: unknown;

  /**
   * End of the validity period.
   */
  validityEnd: unknown;

  /**
   * Start of the suspension period.
   */
  suspensionStart: unknown;

  /**
   * End of the suspension period.
   */
  suspensionEnd: unknown;

  /**
   * Activation date.
   */
  activationAt: unknown;

  /**
   * Number of days before the end of the validity period, or `null` without validity end.
   */
  daysBeforeDeactivation: number | null;
}

/**
 * Key of a date of the lifecycle state.
 */
export type LifecycleDateKey =
  | 'validityStart'
  | 'validityEnd'
  | 'suspensionStart'
  | 'suspensionEnd'
  | 'activationAt';

/**
 * Banners, info texts and candidate actions matching a lifecycle state.
 */
export interface LifecycleUi {
  /**
   * Banners to display, in display order.
   */
  banners: LifecycleBannerKey[];

  /**
   * Info texts to display, in display order.
   */
  infoTexts: LifecycleInfoTextKey[];

  /**
   * Actions offered by the dropdowns, in display order, before filtering by the configured actions.
   */
  actions: LifecycleActionKey[];
}

/**
 * Request sent by a lifecycle action, after a confirmation dialog or a form dialog.
 */
export interface LifecycleAction {
  /**
   * Request URL, as a Nunjucks template rendered with `entity`, the entity merged with the submitted form data,
   * `form`, the submitted form data, `lifecycle`, the lifecycle state, and `immediateDate`, the ISO date
   * `immediateActionDelay` minutes after the submission.
   */
  url: string;

  /**
   * HTTP method of the request.
   * @default 'POST'
   */
  method?: 'DELETE' | 'POST' | 'PUT';

  /**
   * JSON body of the request, rendered like `url` with `renderJson`: each rendered string is parsed as JSON, an empty
   * one giving `null`. A free-text field uses the `dump` filter to stay a string, for example
   * `"{{ (form.comment or none) | dump }}"`. Not sent when empty.
   * @default {}
   */
  body?: Record<string, unknown>;

  /**
   * Fields of the form dialog. Without fields, a confirmation dialog is opened instead.
   * @default []
   */
  formFields?: LinPulsarAttributeConfiguration[];

  /**
   * Whether the form dialog is pre-filled with a deep copy of the entity, for example to modify a period.
   * @default false
   */
  fillFormWithEntity?: boolean;
}

/**
 * Props for the LifecyclePanel component.
 */
export interface LifecyclePanelProps extends CommonComponentProps {
  /**
   * I18n scope for localizing the component.
   */
  i18nScope: string;

  /**
   * Instance identifier passed to the form dialog fields and to the components hosted by the zones.
   */
  instanceId?: string;

  /**
   * Entity whose lifecycle is displayed, provided to the templates of the actions.
   * @default {}
   */
  entity?: Record<string, unknown>;

  /**
   * Entity paths of the lifecycle data, merged with the default paths: `status`, `validityPeriod.start`,
   * `validityPeriod.end`, `suspensionPeriod.start`, `suspensionPeriod.end`, `activationAt` and
   * `daysBeforeDeactivation`.
   * @default {}
   */
  fields?: Partial<LifecycleFieldMapping>;

  /**
   * Statuses for which the panel is displayed. Outside this list, nothing is displayed.
   * @default ['ACTIVE', 'SUSPENDED', 'INACTIVE']
   */
  enabledStates?: string[];

  /**
   * Number of days before the end of the validity period from which the `deactivationWarning` banner replaces the
   * `willDeactivate` info text.
   * @default 15
   */
  deactivationWarningDays?: number;

  /**
   * Delay in minutes between the submission of an action and its `immediateDate`, the start date of the immediate
   * actions, so that it is not already in the past when the API receives it. Also provided as `count` to the
   * notifications of the actions.
   * @default 5
   */
  immediateActionDelay?: number;

  /**
   * Global i18n key of the format of the dates displayed by the banners and the info texts.
   * @default 'application.dateFormat'
   */
  dateFormatKey?: string;

  /**
   * When set, the panel publishes an event with this key on `uiEventSubject` after a successful action, with the
   * response body as data, for example to reload the entity of a details page through its `reloadDetailsOn` option.
   */
  emitOnSubmit?: string;

  /**
   * Actions of the entity, indexed by action key. An action that is not configured is never offered, neither by the
   * dropdowns nor by the banners.
   * @default {}
   */
  actions?: Partial<Record<LifecycleActionKey, LifecycleAction>>;
}

/**
 * Props of the LifecyclePanel read by the `useLifecycleActions` composable when an action runs.
 */
export type LifecycleActionsProps = Required<
  Pick<LifecyclePanelProps, 'entity' | 'actions' | 'immediateActionDelay'>
> &
  Pick<LifecyclePanelProps, 'instanceId' | 'emitOnSubmit'>;

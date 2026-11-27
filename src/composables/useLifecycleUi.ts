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

import { getNestedValue, useCommonMapper } from '@linagora/lin-pulsar-core';
import type {
  LifecycleActionKey,
  LifecycleBannerKey,
  LifecycleFieldMapping,
  LifecycleState,
  LifecycleUi,
} from '../types/lifecyclePanel';

/**
 * Default entity paths of the lifecycle data.
 */
const DEFAULT_LIFECYCLE_FIELDS: LifecycleFieldMapping = {
  status: 'status',
  validityStart: 'validityPeriod.start',
  validityEnd: 'validityPeriod.end',
  suspensionStart: 'suspensionPeriod.start',
  suspensionEnd: 'suspensionPeriod.end',
  activationAt: 'activationAt',
  daysBeforeDeactivation: 'daysBeforeDeactivation',
};

/**
 * Actions offered by the buttons of each banner, in display order.
 */
export const LIFECYCLE_BANNER_ACTIONS: Record<
  LifecycleBannerKey,
  LifecycleActionKey[]
> = {
  suspended: ['reactivation.immediate', 'suspension.modify'],
  deactivated: ['revalidation.immediate', 'revalidation.scheduled'],
  deactivationWarning: ['deactivation.immediate', 'deactivation.modify'],
};

/**
 * Composable projecting the lifecycle data of an entity into the banners, info texts and dropdown actions to display.
 * @returns The functions reading the lifecycle state of an entity and computing its UI.
 */
export function useLifecycleUi() {
  const { toDayJs } = useCommonMapper();

  /**
   * Number of calendar days between today and the given date.
   * @param value - The date, as an ISO string.
   * @returns The number of days, negative for a past date, or `null` when the value is not a date.
   */
  function daysUntil(value: unknown): number | null {
    const date = toDayJs(value);
    const today = toDayJs(new Date().toISOString());

    return date && today
      ? date.startOf('day').diff(today.startOf('day'), 'day')
      : null;
  }

  /**
   * Reads the lifecycle state of an entity. The number of days before deactivation is computed from the validity end
   * when the entity does not provide it as a number.
   * @param entity - The entity.
   * @param fields - The entity paths overriding the default ones.
   * @returns The lifecycle state.
   */
  function toLifecycleState(
    entity: Record<string, unknown>,
    fields: Partial<LifecycleFieldMapping> = {}
  ): LifecycleState {
    const paths = { ...DEFAULT_LIFECYCLE_FIELDS, ...fields };

    /**
     * Reads a lifecycle data from the entity.
     * @param key - The key of the lifecycle data.
     * @returns The value found at the path of the lifecycle data.
     */
    function read(key: keyof LifecycleFieldMapping): unknown {
      return getNestedValue(entity, paths[key]);
    }

    const daysBeforeDeactivation = read('daysBeforeDeactivation');

    return {
      status: read('status'),
      validityStart: read('validityStart'),
      validityEnd: read('validityEnd'),
      suspensionStart: read('suspensionStart'),
      suspensionEnd: read('suspensionEnd'),
      activationAt: read('activationAt'),
      daysBeforeDeactivation:
        typeof daysBeforeDeactivation === 'number'
          ? daysBeforeDeactivation
          : daysUntil(read('validityEnd')),
    };
  }

  /**
   * Whether the given date is set and strictly after now.
   * @param value - The date, as an ISO string.
   * @returns Whether the date is in the future.
   */
  function isFuture(value: unknown): boolean {
    return toDayJs(value)?.isAfter(new Date()) ?? false;
  }

  /**
   * Computes the UI of an inactive entity: a future activation, an activation that never happened, or a validity
   * period that ended. The first matching case wins, in this order.
   * @param state - The lifecycle state.
   * @returns The UI of the entity.
   */
  function toInactiveUi(state: LifecycleState): LifecycleUi {
    if (isFuture(state.validityStart)) {
      return {
        banners: [],
        infoTexts: [],
        actions: [
          'activation.immediate',
          'activation.scheduled',
          'suspension.scheduled',
          'deactivation.scheduled',
        ],
      };
    }

    if (toDayJs(state.activationAt) === null) {
      return {
        banners: [],
        infoTexts: ['notActivated'],
        actions: ['suspension.scheduled', 'deactivation.scheduled'],
      };
    }

    const validityEnd = toDayJs(state.validityEnd);

    return validityEnd?.isBefore(new Date())
      ? { banners: ['deactivated'], infoTexts: [], actions: [] }
      : { banners: [], infoTexts: [], actions: [] };
  }

  /**
   * Computes the UI of an active entity, from its validity end and its future suspension.
   * @param state - The lifecycle state.
   * @param deactivationWarningDays - The number of days from which the deactivation warning banner is displayed.
   * @returns The UI of the entity.
   */
  function toActiveUi(
    state: LifecycleState,
    deactivationWarningDays: number
  ): LifecycleUi {
    const days = state.daysBeforeDeactivation;
    const infoTexts: LifecycleUi['infoTexts'] = [];

    if (days !== null && days > deactivationWarningDays) {
      infoTexts.push('willDeactivate');
    }

    if (isFuture(state.suspensionStart)) {
      infoTexts.push('willSuspend');
    }

    if (days !== null && days <= deactivationWarningDays) {
      return {
        banners: ['deactivationWarning'],
        infoTexts,
        actions: ['suspension.immediate', 'suspension.scheduled'],
      };
    }

    if (days !== null) {
      return {
        banners: [],
        infoTexts,
        actions: [
          'suspension.immediate',
          'suspension.scheduled',
          'deactivation.immediate',
          'deactivation.modify',
        ],
      };
    }

    return {
      banners: [],
      infoTexts,
      actions: [
        'suspension.immediate',
        'suspension.scheduled',
        'deactivation.immediate',
        'deactivation.scheduled',
      ],
    };
  }

  /**
   * Computes the UI of a suspended entity, from its validity end.
   * @param state - The lifecycle state.
   * @param deactivationWarningDays - The number of days from which the deactivation warning banner is displayed.
   * @returns The UI of the entity.
   */
  function toSuspendedUi(
    state: LifecycleState,
    deactivationWarningDays: number
  ): LifecycleUi {
    const days = state.daysBeforeDeactivation;
    const isWarning = days !== null && days <= deactivationWarningDays;

    return {
      banners: isWarning ? ['suspended', 'deactivationWarning'] : ['suspended'],
      infoTexts: days !== null && !isWarning ? ['willDeactivate'] : [],
      actions: ['deactivation.immediate', 'deactivation.scheduled'],
    };
  }

  /**
   * Computes the banners, info texts and dropdown actions matching a lifecycle state.
   * @param state - The lifecycle state.
   * @param deactivationWarningDays - The number of days before the validity end from which the deactivation warning
   * banner replaces the will-deactivate info text.
   * @returns The UI of the entity, or `null` when its status is not set.
   */
  function toLifecycleUi(
    state: LifecycleState,
    deactivationWarningDays: number
  ): LifecycleUi | null {
    switch (state.status) {
      case undefined:
      case null:
      case '':
        return null;
      case 'INACTIVE':
        return toInactiveUi(state);
      case 'ACTIVE':
        return toActiveUi(state, deactivationWarningDays);
      case 'SUSPENDED':
        return toSuspendedUi(state, deactivationWarningDays);
      default:
        return { banners: [], infoTexts: [], actions: [] };
    }
  }

  return { toLifecycleState, toLifecycleUi };
}

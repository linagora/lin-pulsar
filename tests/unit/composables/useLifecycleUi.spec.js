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

import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLifecycleUi } from '../../../src/composables/useLifecycleUi';

vi.mock('@linagora/lin-pulsar-core', async () => {
  const { getNestedValue } = await vi.importActual('@linagora/lin-pulsar-core');
  return {
    getNestedValue,
    useCommonMapper: () => ({
      toDayJs: (value) => (value ? dayjs(value) : null),
    }),
  };
});

const NOW_ISO = '2026-05-04T12:00:00Z';

/**
 * Builds an active account entity, overridden by the given properties.
 * @param overrides - Properties overriding the default ones.
 * @returns The entity.
 */
const buildEntity = (overrides = {}) => ({
  status: 'ACTIVE',
  validityPeriod: { start: '2026-01-01T00:00:00Z', end: null },
  suspensionPeriod: { start: null, end: null },
  activationAt: '2026-01-02T00:00:00Z',
  daysBeforeDeactivation: null,
  ...overrides,
});

/**
 * Computes the UI of an entity with the default fields and a 15-day warning.
 * @param entity - The entity.
 * @returns The UI of the entity.
 */
const project = (entity) => {
  const { toLifecycleState, toLifecycleUi } = useLifecycleUi();
  return toLifecycleUi(toLifecycleState(entity), 15);
};

describe('Test composable: useLifecycleUi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers().setSystemTime(new Date(NOW_ISO));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Test function: toLifecycleState', () => {
    it('should read the lifecycle data from the default paths', () => {
      const { toLifecycleState } = useLifecycleUi();

      expect(
        toLifecycleState({
          status: 'SUSPENDED',
          validityPeriod: { start: 'vs', end: 've' },
          suspensionPeriod: { start: 'ss', end: 'se' },
          activationAt: 'aa',
          daysBeforeDeactivation: 3,
        })
      ).toEqual({
        status: 'SUSPENDED',
        validityStart: 'vs',
        validityEnd: 've',
        suspensionStart: 'ss',
        suspensionEnd: 'se',
        activationAt: 'aa',
        daysBeforeDeactivation: 3,
      });
    });

    it('should read the lifecycle data from the configured paths', () => {
      const { toLifecycleState } = useLifecycleUi();

      expect(
        toLifecycleState(
          { state: 'ACTIVE', suspension: { from: 'ss' } },
          { status: 'state', suspensionStart: 'suspension.from' }
        )
      ).toMatchObject({ status: 'ACTIVE', suspensionStart: 'ss' });
    });

    it('should compute the days before deactivation from the validity end when not provided', () => {
      const { toLifecycleState } = useLifecycleUi();

      expect(
        toLifecycleState(
          buildEntity({
            validityPeriod: { start: null, end: '2026-05-14T08:00:00Z' },
          })
        ).daysBeforeDeactivation
      ).toEqual(10);
    });

    it('should keep the days before deactivation provided by the entity', () => {
      const { toLifecycleState } = useLifecycleUi();

      expect(
        toLifecycleState(
          buildEntity({
            validityPeriod: { start: null, end: '2026-05-14T08:00:00Z' },
            daysBeforeDeactivation: 9,
          })
        ).daysBeforeDeactivation
      ).toEqual(9);
    });

    it('should have no days before deactivation without validity end', () => {
      const { toLifecycleState } = useLifecycleUi();

      expect(toLifecycleState(buildEntity()).daysBeforeDeactivation).toBeNull();
    });
  });

  describe('Test function: toLifecycleUi', () => {
    it('should return null without status', () => {
      expect(project({})).toBeNull();
      expect(project(buildEntity({ status: '' }))).toBeNull();
    });

    it('should display nothing for an unknown status', () => {
      expect(project(buildEntity({ status: 'ARCHIVED' }))).toEqual({
        banners: [],
        infoTexts: [],
        actions: [],
      });
    });

    it('should offer the activation of an inactive entity whose validity starts in the future', () => {
      expect(
        project(
          buildEntity({
            status: 'INACTIVE',
            validityPeriod: { start: '2026-06-01T00:00:00Z', end: null },
            activationAt: null,
          })
        )
      ).toEqual({
        banners: [],
        infoTexts: [],
        actions: [
          'activation.immediate',
          'activation.scheduled',
          'suspension.scheduled',
          'deactivation.scheduled',
        ],
      });
    });

    it('should display the not activated info text of an inactive entity never activated', () => {
      expect(
        project(buildEntity({ status: 'INACTIVE', activationAt: null }))
      ).toEqual({
        banners: [],
        infoTexts: ['notActivated'],
        actions: ['suspension.scheduled', 'deactivation.scheduled'],
      });
    });

    it('should display the deactivated banner of an inactive entity whose validity ended', () => {
      expect(
        project(
          buildEntity({
            status: 'INACTIVE',
            validityPeriod: {
              start: '2026-01-01T00:00:00Z',
              end: '2026-05-01T00:00:00Z',
            },
          })
        )
      ).toEqual({ banners: ['deactivated'], infoTexts: [], actions: [] });
    });

    it('should display nothing for an activated inactive entity whose validity has not ended', () => {
      expect(project(buildEntity({ status: 'INACTIVE' }))).toEqual({
        banners: [],
        infoTexts: [],
        actions: [],
      });
    });

    it('should offer the suspension and the deactivation of an active entity without validity end', () => {
      expect(project(buildEntity())).toEqual({
        banners: [],
        infoTexts: [],
        actions: [
          'suspension.immediate',
          'suspension.scheduled',
          'deactivation.immediate',
          'deactivation.scheduled',
        ],
      });
    });

    it('should ignore a past suspension of an active entity', () => {
      expect(
        project(
          buildEntity({
            suspensionPeriod: {
              start: '2026-01-01T00:00:00Z',
              end: '2026-02-01T00:00:00Z',
            },
          })
        ).infoTexts
      ).toEqual([]);
    });

    it('should display the will deactivate info text beyond the warning days', () => {
      expect(
        project(
          buildEntity({
            validityPeriod: { start: null, end: '2026-12-01T00:00:00Z' },
            daysBeforeDeactivation: 16,
          })
        )
      ).toEqual({
        banners: [],
        infoTexts: ['willDeactivate'],
        actions: [
          'suspension.immediate',
          'suspension.scheduled',
          'deactivation.immediate',
          'deactivation.modify',
        ],
      });
    });

    it('should display the deactivation warning banner within the warning days, boundary included', () => {
      expect(
        project(
          buildEntity({
            validityPeriod: { start: null, end: '2026-05-19T00:00:00Z' },
            daysBeforeDeactivation: 15,
          })
        )
      ).toEqual({
        banners: ['deactivationWarning'],
        infoTexts: [],
        actions: ['suspension.immediate', 'suspension.scheduled'],
      });
    });

    it('should display the deactivation warning banner on the last day of validity', () => {
      expect(
        project(
          buildEntity({
            validityPeriod: { start: null, end: '2026-05-04T18:00:00Z' },
            daysBeforeDeactivation: 0,
          })
        )
      ).toEqual({
        banners: ['deactivationWarning'],
        infoTexts: [],
        actions: ['suspension.immediate', 'suspension.scheduled'],
      });
    });

    it('should display the will suspend info text of an active entity with a future suspension', () => {
      expect(
        project(
          buildEntity({
            suspensionPeriod: { start: '2026-06-01T00:00:00Z', end: null },
          })
        )
      ).toEqual({
        banners: [],
        infoTexts: ['willSuspend'],
        actions: [
          'suspension.immediate',
          'suspension.scheduled',
          'deactivation.immediate',
          'deactivation.scheduled',
        ],
      });
    });

    it('should combine the will deactivate and will suspend info texts', () => {
      expect(
        project(
          buildEntity({
            validityPeriod: { start: null, end: '2026-12-01T00:00:00Z' },
            suspensionPeriod: { start: '2026-06-01T00:00:00Z', end: null },
            daysBeforeDeactivation: 30,
          })
        ).infoTexts
      ).toEqual(['willDeactivate', 'willSuspend']);
    });

    it('should combine the deactivation warning banner and the will suspend info text', () => {
      expect(
        project(
          buildEntity({
            validityPeriod: { start: null, end: '2026-05-12T00:00:00Z' },
            suspensionPeriod: { start: '2026-05-10T00:00:00Z', end: null },
            daysBeforeDeactivation: 8,
          })
        )
      ).toEqual({
        banners: ['deactivationWarning'],
        infoTexts: ['willSuspend'],
        actions: ['suspension.immediate', 'suspension.scheduled'],
      });
    });

    it('should display the suspended banner of a suspended entity without validity end', () => {
      expect(
        project(
          buildEntity({
            status: 'SUSPENDED',
            suspensionPeriod: {
              start: '2026-04-01T00:00:00Z',
              end: '2026-08-01T00:00:00Z',
            },
          })
        )
      ).toEqual({
        banners: ['suspended'],
        infoTexts: [],
        actions: ['deactivation.immediate', 'deactivation.scheduled'],
      });
    });

    it('should add the will deactivate info text of a suspended entity beyond the warning days', () => {
      expect(
        project(
          buildEntity({
            status: 'SUSPENDED',
            validityPeriod: { start: null, end: '2026-12-01T00:00:00Z' },
            suspensionPeriod: { start: '2026-04-01T00:00:00Z', end: null },
            daysBeforeDeactivation: 30,
          })
        )
      ).toEqual({
        banners: ['suspended'],
        infoTexts: ['willDeactivate'],
        actions: ['deactivation.immediate', 'deactivation.scheduled'],
      });
    });

    it('should add the deactivation warning banner of a suspended entity within the warning days', () => {
      expect(
        project(
          buildEntity({
            status: 'SUSPENDED',
            validityPeriod: { start: null, end: '2026-05-12T00:00:00Z' },
            suspensionPeriod: { start: '2026-04-01T00:00:00Z', end: null },
            daysBeforeDeactivation: 8,
          })
        )
      ).toEqual({
        banners: ['suspended', 'deactivationWarning'],
        infoTexts: [],
        actions: ['deactivation.immediate', 'deactivation.scheduled'],
      });
    });

    it('should add the deactivation warning banner of a suspended entity on the last day of validity', () => {
      expect(
        project(
          buildEntity({
            status: 'SUSPENDED',
            validityPeriod: { start: null, end: '2026-05-04T18:00:00Z' },
            suspensionPeriod: { start: '2026-04-01T00:00:00Z', end: null },
            daysBeforeDeactivation: 0,
          })
        )
      ).toEqual({
        banners: ['suspended', 'deactivationWarning'],
        infoTexts: [],
        actions: ['deactivation.immediate', 'deactivation.scheduled'],
      });
    });

    it('should apply the configured warning days', () => {
      const { toLifecycleState, toLifecycleUi } = useLifecycleUi();
      const state = toLifecycleState(
        buildEntity({
          validityPeriod: { start: null, end: '2026-05-24T00:00:00Z' },
          daysBeforeDeactivation: 20,
        })
      );

      expect(toLifecycleUi(state, 15).banners).toEqual([]);
      expect(toLifecycleUi(state, 30).banners).toEqual(['deactivationWarning']);
    });

    it('should support an organizational unit without validity period nor activation date', () => {
      expect(
        project({
          status: 'SUSPENDED',
          suspensionPeriod: { start: '2026-04-01T00:00:00Z', end: null },
        })
      ).toEqual({
        banners: ['suspended'],
        infoTexts: [],
        actions: ['deactivation.immediate', 'deactivation.scheduled'],
      });
    });
  });
});

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

import type { DropdownClickPayload } from '@linagora/lin-pulsar-core';
import type { CommonComponentProps } from './common';
import type { FieldFormatter } from './ModuleGenericDetailsPageOptions';

/**
 * Configuration of a lifecycle banner.
 */
export interface LifecycleBanner {
  /**
   * Key of the banner, selecting its translations, design namespace, CSS class and `data-cy`, for
   * example `suspended`.
   */
  key: string;

  /**
   * Keys of the actions offered by the banner buttons, in display order, for example
   * `suspension.modify`. A duplicated key is only displayed once.
   * @default []
   */
  actions?: string[];

  /**
   * Named parameters of the content translation, each read from an entity field and optionally
   * formatted, for example
   * `{ "date": { "field": "suspensionPeriod.start", "formatter": "toDate", "formatOptions": { "formatKey": "application.dateFormat" } } }`.
   * @default {}
   */
  params?: Record<string, FieldFormatter>;

  /**
   * Translation key of the content, relative to the banner key, as a Nunjucks template rendered
   * with `entity`, for example
   * `"{{ 'contentWithEndDate' if entity.suspensionPeriod.end else 'content' }}"`.
   * @default 'content'
   */
  content?: string;
}

/**
 * Props for the LifecycleBannersCard component.
 */
export interface LifecycleBannersCardProps extends CommonComponentProps {
  /**
   * I18n scope for localizing the component.
   */
  i18nScope: string;

  /**
   * Entity whose fields fill the banner contents, also provided to the `content` templates.
   * @default {}
   */
  entity?: Record<string, unknown>;

  /**
   * Banners to display, in display order, usually selected by the host from the entity status.
   * Only the first configuration of each key is kept.
   */
  banners: LifecycleBanner[];

  /**
   * When set, the card publishes an event with this key on `uiEventSubject` when a banner button
   * is clicked, with the action key as `key` of its data, for example to run the action through
   * the `triggerActionOn` option of a `LifecycleButtonsCard`.
   */
  emitOnClick?: string;
}

/**
 * Outputs (events) emitted by the LifecycleBannersCard component.
 */
export interface LifecycleBannersCardOutputs {
  /**
   * Emitted with the action key when a banner button is clicked.
   */
  actionClick: [DropdownClickPayload];
}

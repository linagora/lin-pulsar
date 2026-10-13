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

import { Avatar } from '@dicebear/core';
import { useNunjucks } from '@linagora/linid-im-front-corelib';
import type { Ref } from 'vue';
import { ref, toRaw, watchEffect } from 'vue';
import { loadDiceBearStyle } from '../services/diceBearLoaderService';
import type { AvatarOptions } from '../types/diceBear';

/**
 * Generates a deterministic DiceBear avatar from an entity, as a data URI ref.
 *
 * The seed templates are rendered with the entity, joined, and handed to the configured DiceBear
 * style, so the same entity always produces the same avatar. The avatar is regenerated whenever
 * the options or the entity change, and a result resolving after a newer run started is discarded.
 * When no options are provided or the generation fails, the ref holds `undefined` so the caller
 * renders its own fallback.
 * @param avatarOptions - Getter of the DiceBear generation options; `undefined` disables generation.
 * @param entity - Getter of the entity the seed templates are rendered with.
 * @returns The generated avatar as a data URI, or `undefined`.
 */
export function useDiceBearAvatar(
  avatarOptions: () => AvatarOptions | undefined,
  entity: () => Record<string, unknown>
): Ref<string | undefined> {
  const { renderString } = useNunjucks();
  const diceBearSrc = ref<string | undefined>(undefined);

  watchEffect(async (onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    const options = avatarOptions();

    if (!options) {
      diceBearSrc.value = undefined;
      return;
    }

    const { seed, style, styleOptions } = options;

    try {
      const renderedSeed = seed
        .map((template) => renderString(template, { entity: entity() }))
        .join('');

      const loadedStyle = await loadDiceBearStyle(style);

      if (cancelled) {
        return;
      }

      // DiceBear clones its options with structuredClone, which throws on the reactive
      // proxies wrapping zone props: hand it the raw object.
      diceBearSrc.value = new Avatar(loadedStyle, {
        ...toRaw(styleOptions ?? {}),
        seed: renderedSeed,
      }).toDataUri();
    } catch {
      if (!cancelled) {
        diceBearSrc.value = undefined;
      }
    }
  });

  return diceBearSrc;
}

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

import { mount, shallowMount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EntityAttributeDynamicListField from '../../../../src/components/field/EntityAttributeDynamicListField.vue';
import EntityAttributeGroupedDynamicListField from '../../../../src/components/field/EntityAttributeGroupedDynamicListField.vue';

const mockUi = vi.fn(() => ({}));
const mockTranslateOrDefault = vi.fn((defaultValue) => defaultValue);
const mockRequiredRule = vi.fn(() => true);
const mockApiRule = vi.fn(() => true);
const mockUseQuasarRules = vi.hoisted(() => vi.fn());
const mockApiEndpointContext = vi.hoisted(() => ({
  value: { params: { structureId: 'structure-7' } },
}));

vi.mock('../../../../src/composables/useApiEndpointContext', () => ({
  useApiEndpointContext: () => mockApiEndpointContext,
}));

vi.mock('@linagora/lin-pulsar-core', async () => {
  const { getNestedValue, setNestedValue } = await vi.importActual(
    '@linagora/lin-pulsar-core'
  );
  return {
    getNestedValue,
    setNestedValue,
    useUiDesign: () => ({ ui: mockUi }),
    useScopedI18n: () => ({ translateOrDefault: mockTranslateOrDefault }),
    useQuasarRules: (...args) => {
      mockUseQuasarRules(...args);
      const [, definition] = args;
      return [
        ...(definition.required ? [mockRequiredRule] : []),
        ...(definition.hasValidations ? [mockApiRule] : []),
      ];
    },
    useNunjucks: () => ({
      renderString: (value, context) =>
        value.replace(
          /\{\{\s*([\w.]+)\s*\}\}/g,
          (_, path) =>
            path.split('.').reduce((acc, key) => acc?.[key], context) ?? ''
        ),
    }),
  };
});

describe('Test component: EntityAttributeGroupedDynamicListField', () => {
  let wrapper;
  let mountingOptions;

  const teamList = [
    { id: 'TEAM_42', name: 'Support', code: 'SUP-01' },
    { id: 43, name: 'Sales', code: 'SAL-02' },
  ];

  /**
   * Builds the mounting options of the field.
   * @param inputSettings - Settings merged into the default ones.
   * @param entity - Attributes merged into the default entity.
   * @returns The mounting options.
   */
  const buildOptions = (inputSettings = {}, entity = {}) => ({
    props: {
      uiNamespace: 'namespace',
      instanceId: 'id',
      i18nScope: 'scope',
      definition: {
        name: 'teamRoles',
        type: 'Array',
        required: false,
        hasValidations: false,
        input: 'GroupedDynamicList',
        inputSettings: {
          items: 'teams',
          itemLabel: '{{ item.name }}',
          field: {
            route: '/api/teams/{{ item.id }}/roles',
            optionLabel: '{{ name }}',
            optionValue: '{{ id }}',
            loadOnOpen: true,
          },
          ...inputSettings,
        },
      },
      entity: { name: 'entity-name', teams: teamList, ...entity },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockTranslateOrDefault.mockImplementation((defaultValue) => defaultValue);
    mountingOptions = buildOptions();
  });

  describe('Test computed: rows', () => {
    it('should list one row per item of the collection, with its rendered label', () => {
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(
        wrapper.vm.rows.map(({ key, label, caption }) => ({
          key,
          label,
          caption,
        }))
      ).toEqual([
        { key: 'TEAM_42', label: 'Support', caption: '' },
        { key: '43', label: 'Sales', caption: '' },
      ]);
    });

    it('should render the caption with the entity and the item', () => {
      mountingOptions = buildOptions({
        itemCaption: '{{ item.code }} - {{ entity.name }}',
      });
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rows[0].caption).toEqual('SUP-01 - entity-name');
    });

    it('should read the item key from itemKey', () => {
      mountingOptions = buildOptions({ itemKey: 'code' });
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rows.map((row) => row.key)).toEqual([
        'SUP-01',
        'SAL-02',
      ]);
    });

    it('should skip the items that are not objects or have no key', () => {
      mountingOptions = buildOptions(
        {},
        {
          teams: [
            null,
            'TEAM_1',
            { name: 'No key' },
            { id: '', name: 'Empty key' },
            { id: 0, name: 'Zero key' },
            teamList[0],
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rows.map((row) => row.key)).toEqual(['0', 'TEAM_42']);
      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([
        { id: 0, values: [] },
        { id: 'TEAM_42', values: [] },
      ]);
    });

    it('should list an item once when an earlier item holds its key', () => {
      mountingOptions = buildOptions(
        {},
        {
          teams: [
            teamList[0],
            { ...teamList[0], name: 'Duplicate' },
            { id: 43, name: 'Sales' },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rows.map((row) => row.key)).toEqual(['TEAM_42', '43']);
      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([
        { id: 'TEAM_42', values: [] },
        { id: 43, values: [] },
      ]);
    });

    it('should list no row when the collection is missing or is not an array', () => {
      mountingOptions = buildOptions({}, { teams: 'none' });
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rows).toEqual([]);
      expect(wrapper.vm.isEmpty).toBe(true);
    });

    it('should read the collection from a nested path', () => {
      mountingOptions = buildOptions(
        { items: 'department.teams' },
        { department: { teams: [teamList[0]] } }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rows.map((row) => row.key)).toEqual(['TEAM_42']);
    });
  });

  describe('Test value', () => {
    it('should start every item with an empty selection, keyed by id and values', () => {
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([
        { id: 'TEAM_42', values: [] },
        { id: 43, values: [] },
      ]);
    });

    it('should name the key and the values with keyProperty and valuesProperty', () => {
      mountingOptions = buildOptions({
        keyProperty: 'teamId',
        valuesProperty: 'roleIds',
      });
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([
        { teamId: 'TEAM_42', roleIds: [] },
        { teamId: 43, roleIds: [] },
      ]);
    });

    it('should keep the stored selections, matching a numeric key with a string one', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: '43', values: ['ROLE_3'] },
            { id: 'TEAM_42', values: ['ROLE_1', 'ROLE_2'] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.value).toEqual([
        { id: 'TEAM_42', values: ['ROLE_1', 'ROLE_2'] },
        { id: '43', values: ['ROLE_3'] },
      ]);
    });

    it('should not emit when the stored entries match in another order, with other properties', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { values: ['ROLE_3'], id: '43', label: 'Sales' },
            { id: 'TEAM_42', values: ['ROLE_1'] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.emitted('update:entity')).toBeUndefined();
    });

    it('should keep the other properties of the stored entries when the collection changes', async () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'], label: 'Support' },
            { id: '43', values: [], label: 'Sales' },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      await wrapper.setProps({
        entity: {
          ...mountingOptions.props.entity,
          teams: [...teamList, { id: 'TEAM_44', name: 'Marketing' }],
        },
      });

      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([
        { id: 'TEAM_42', values: ['ROLE_1'], label: 'Support' },
        { id: '43', values: [], label: 'Sales' },
        { id: 'TEAM_44', values: [] },
      ]);
    });

    it('should prune the selections of items no longer in the collection', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 'TEAM_99', values: ['ROLE_9'] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([
        { id: 'TEAM_42', values: ['ROLE_1'] },
        { id: 43, values: [] },
      ]);
    });

    it('should not emit when the stored value already matches the collection', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 43, values: [] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.emitted('update:entity')).toBeUndefined();
    });

    it('should store an empty array when the collection is empty and nothing is stored', () => {
      mountingOptions = buildOptions({}, { teams: [] });
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([]);
    });

    it('should ignore stored entries that are not objects', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [null, 'TEAM_42', { id: 'TEAM_42', values: 'ROLE_1' }],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([
        { id: 'TEAM_42', values: [] },
        { id: 43, values: [] },
      ]);
    });

    it('should leave the stored value alone when the collection is not an array', () => {
      mountingOptions = buildOptions(
        {},
        {
          teams: undefined,
          teamRoles: [{ id: 'TEAM_42', values: ['ROLE_1'] }],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.emitted('update:entity')).toBeUndefined();
    });

    it('should follow a collection that changes', async () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 43, values: [] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      await wrapper.setProps({
        entity: {
          ...mountingOptions.props.entity,
          teams: [teamList[0], { id: 'TEAM_44', name: 'Marketing' }],
        },
      });

      expect(wrapper.emitted('update:entity')[0][0].teamRoles).toEqual([
        { id: 'TEAM_42', values: ['ROLE_1'] },
        { id: 'TEAM_44', values: [] },
      ]);
    });

    it('should keep the selected values while another attribute changes, so that they are not validated again', async () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 43, values: ['ROLE_3'] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );
      const selectedValues = wrapper.vm.selectedValues;

      await wrapper.setProps({
        entity: { ...mountingOptions.props.entity, name: 'renamed' },
      });

      expect(wrapper.vm.selectedValues).toBe(selectedValues);
    });

    it('should list every selected value for the rules', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1', 'ROLE_2'] },
            { id: 43, values: ['ROLE_3'] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.selectedValues).toEqual(['ROLE_1', 'ROLE_2', 'ROLE_3']);
    });
  });

  describe('Test inner dynamic lists', () => {
    it('should give each list the scope and namespace of the field, its keys under fields.field', () => {
      wrapper = shallowMount(EntityAttributeGroupedDynamicListField, {
        ...mountingOptions,
        global: {
          stubs: {
            QField: { template: '<div><slot name="control" /></div>' },
            QList: { template: '<div><slot /></div>' },
            QItem: { template: '<div><slot /></div>' },
            QItemSection: { template: '<div><slot /></div>' },
            QItemLabel: { template: '<div><slot /></div>' },
            QIcon: true,
          },
        },
      });
      const lists = wrapper.findAllComponents(EntityAttributeDynamicListField);

      expect(lists).toHaveLength(2);
      expect(lists[0].props('i18nScope')).toEqual('scope.fields.teamRoles');
      expect(lists[0].props('uiNamespace')).toEqual('namespace.teamRoles');
      expect(lists[0].props('definition').name).toEqual('field');
      expect(lists[0].props('context')).toEqual({ item: teamList[0] });
      expect(lists[0].props('ignoreRules')).toBe(true);
    });

    it('should define a multiple dynamic list named field, without rules', () => {
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.innerDefinition).toEqual({
        name: 'field',
        type: 'Array',
        required: false,
        hasValidations: false,
        input: 'DynamicList',
        inputSettings: {
          route: '/api/teams/{{ item.id }}/roles',
          optionLabel: '{{ name }}',
          optionValue: '{{ id }}',
          loadOnOpen: true,
          multiple: true,
        },
      });
    });

    it('should load each list when it is opened by default, so that many items send no request at once', () => {
      mountingOptions = buildOptions({
        field: { route: '/api/teams/{{ item.id }}/roles' },
      });
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.innerDefinition.inputSettings.loadOnOpen).toBe(true);
    });

    it('should load each list at once when the field settings ask for it', () => {
      mountingOptions = buildOptions({
        field: { route: '/api/teams/{{ item.id }}/roles', loadOnOpen: false },
      });
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.innerDefinition.inputSettings.loadOnOpen).toBe(false);
    });

    it('should give each list an entity holding the selection of its item, and the item as context', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 43, values: [] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      const [row] = wrapper.vm.rows;
      expect(row.entity).toEqual({ field: ['ROLE_1'] });
      expect(row.context).toEqual({ item: teamList[0] });
    });

    it('should store the selection of one item and keep the others', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 43, values: ['ROLE_3'] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );
      const [row] = wrapper.vm.rows;

      wrapper.vm.updateRow(row, { ...row.entity, field: ['ROLE_1', 'ROLE_2'] });

      expect(wrapper.emitted('update:entity')[0][0]).toEqual({
        ...mountingOptions.props.entity,
        teamRoles: [
          { id: 'TEAM_42', values: ['ROLE_1', 'ROLE_2'] },
          { id: 43, values: ['ROLE_3'] },
        ],
      });
    });
  });

  describe('Test updates before the parent renders again', () => {
    it('should keep every row update emitted before the entity comes back', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 43, values: ['ROLE_3'] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );
      const [first, second] = wrapper.vm.rows;

      wrapper.vm.updateRow(first, { field: [] });
      wrapper.vm.updateRow(second, { field: [] });

      expect(wrapper.emitted('update:entity')[1][0].teamRoles).toEqual([
        { id: 'TEAM_42', values: [] },
        { id: 43, values: [] },
      ]);
    });

    it('should build the next update from the entity given back by the parent', async () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 43, values: ['ROLE_3'] },
          ],
        }
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );
      const [first] = wrapper.vm.rows;

      wrapper.vm.updateRow(first, { field: [] });
      await wrapper.setProps({
        entity: {
          ...mountingOptions.props.entity,
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_2'] },
            { id: 43, values: ['ROLE_3'] },
          ],
        },
      });
      wrapper.vm.updateRow(wrapper.vm.rows[1], { field: ['ROLE_4'] });

      expect(wrapper.emitted('update:entity')[1][0].teamRoles).toEqual([
        { id: 'TEAM_42', values: ['ROLE_2'] },
        { id: 43, values: ['ROLE_4'] },
      ]);
    });
  });

  describe('Test rows across entity changes', () => {
    const stored = {
      teamRoles: [
        { id: 'TEAM_42', values: ['ROLE_1'] },
        { id: 43, values: [] },
      ],
    };

    it('should keep the entity and context of each row when an attribute the lists do not read changes', async () => {
      mountingOptions = buildOptions({}, stored);
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );
      const [before] = wrapper.vm.rows;

      await wrapper.setProps({
        entity: { ...mountingOptions.props.entity, name: 'renamed' },
      });

      const [after] = wrapper.vm.rows;
      expect(after.entity).toBe(before.entity);
      expect(after.context).toBe(before.context);
      expect(after.entity).toEqual({ field: ['ROLE_1'] });
      expect(after.templateEntity).toBeUndefined();
    });

    it('should give the list templates the whole entity, unshadowed, when they read it', async () => {
      mountingOptions = buildOptions(
        {
          field: {
            route: '/api/teams/{{ item.id }}/roles',
            optionDisabled: '{{ entity.locked }}',
          },
        },
        stored
      );
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      await wrapper.setProps({
        entity: {
          ...mountingOptions.props.entity,
          name: 'renamed',
          field: 'own attribute',
        },
      });

      expect(wrapper.vm.rows[0].entity).toEqual({ field: ['ROLE_1'] });
      expect(wrapper.vm.rows[0].templateEntity.name).toEqual('renamed');
      expect(wrapper.vm.rows[0].templateEntity.field).toEqual('own attribute');
    });

    it('should give a row a new entity when its selection changes', async () => {
      mountingOptions = buildOptions({}, stored);
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      await wrapper.setProps({
        entity: {
          ...mountingOptions.props.entity,
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1', 'ROLE_2'] },
            { id: 43, values: [] },
          ],
        },
      });

      expect(wrapper.vm.rows[0].entity).toEqual({
        field: ['ROLE_1', 'ROLE_2'],
      });
    });
  });

  describe('Test rendering', () => {
    it('should read a ui entry for every element of the field', () => {
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(
        mockUi.mock.calls.map(
          ([namespace, component]) => `${namespace}|${component}`
        )
      ).toEqual([
        'namespace.teamRoles|q-field',
        'namespace.teamRoles.list|q-list',
        'namespace.teamRoles.item|q-item',
        'namespace.teamRoles.item-section|q-item-section',
        'namespace.teamRoles.item-label|q-item-label',
        'namespace.teamRoles.item-caption|q-item-label',
        'namespace.teamRoles.field-section|q-item-section',
        'namespace.teamRoles.empty|q-item',
        'namespace.teamRoles.empty-avatar|q-item-section',
        'namespace.teamRoles.empty-icon|q-icon',
        'namespace.teamRoles.empty-message|q-item-section',
      ]);
    });

    it('should show its error under the items without an error icon that would narrow them', async () => {
      mountingOptions.props.definition.required = true;
      wrapper = mount(EntityAttributeGroupedDynamicListField, {
        ...mountingOptions,
        global: {
          plugins: [[Quasar, {}]],
          stubs: { EntityAttributeDynamicListField: true },
        },
      });
      mockRequiredRule.mockReturnValueOnce('Choose a role');

      await wrapper.findComponent({ name: 'QField' }).vm.validate();
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Choose a role');
      expect(wrapper.find('.q-field__append').exists()).toBe(false);
    });

    it('should display the empty message when the collection holds no item', () => {
      mockTranslateOrDefault.mockImplementation((defaultValue, key) =>
        key === 'empty' ? 'No team' : defaultValue
      );
      wrapper = mount(EntityAttributeGroupedDynamicListField, {
        ...buildOptions({}, { teams: [] }),
        global: { plugins: [[Quasar, {}]] },
      });

      expect(wrapper.find('.q-list').text()).toContain('No team');
    });

    it('should render one row per item, holding its label and its list', () => {
      wrapper = mount(EntityAttributeGroupedDynamicListField, {
        ...mountingOptions,
        global: {
          plugins: [[Quasar, {}]],
          stubs: { EntityAttributeDynamicListField: true },
        },
      });
      const rows = wrapper.findAll('[data-cy^="field_teamRoles_"]');

      expect(rows.map((row) => row.attributes('data-cy'))).toEqual([
        'field_teamRoles_TEAM_42',
        'field_teamRoles_43',
      ]);
      expect(rows[0].text()).toContain('Support');
      expect(
        rows[0]
          .findComponent({ name: 'EntityAttributeDynamicListField' })
          .exists()
      ).toBe(true);
    });
  });

  describe('Test computed: rules', () => {
    it('should check the selected values of every item with the required rule', () => {
      mountingOptions.props.definition.required = true;
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rules).toHaveLength(1);
      wrapper.vm.rules[0](['ROLE_1']);
      expect(mockRequiredRule).toHaveBeenCalledWith(['ROLE_1']);
      expect(mockUseQuasarRules).toHaveBeenCalledWith(
        'id',
        { ...mountingOptions.props.definition, hasValidations: false },
        [],
        'scope.fields.teamRoles',
        mockApiEndpointContext
      );
    });

    it('should send the stored value to the API validation, not the selected values', () => {
      mountingOptions = buildOptions(
        {},
        {
          teamRoles: [
            { id: 'TEAM_42', values: ['ROLE_1'] },
            { id: 43, values: [] },
          ],
        }
      );
      mountingOptions.props.definition.hasValidations = true;
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rules).toHaveLength(1);
      wrapper.vm.rules[0](['ROLE_1']);
      expect(mockApiRule.mock.calls[0][0]).toEqual([
        { id: 'TEAM_42', values: ['ROLE_1'] },
        { id: 43, values: [] },
      ]);
      expect(mockUseQuasarRules).toHaveBeenCalledWith(
        'id',
        { ...mountingOptions.props.definition, required: false },
        [],
        'scope.fields.teamRoles',
        mockApiEndpointContext
      );
    });

    it('should have no rule when ignoreRules is set', () => {
      mountingOptions.props.ignoreRules = true;
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rules).toEqual([]);
    });

    it('should have no rule when the settings ignore them', () => {
      mountingOptions = buildOptions({ ignoreRules: true });
      wrapper = shallowMount(
        EntityAttributeGroupedDynamicListField,
        mountingOptions
      );

      expect(wrapper.vm.rules).toEqual([]);
    });
  });
});

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

export default {
  'fr-FR': {
    '{{ config.instanceId }}': {
      LifecyclePanel: {
        submitSuccess: 'Action effectuée avec succès',
        submitError: "Erreur lors de l'action",
        LifecycleBannersCard: {
          suspended: {
            content: 'Suspension depuis le {date}.',
            contentWithEndDate: 'Suspension du {date} au {endDate}.',
            actions: {
              reactivation: {
                immediate: 'Réactivation immédiate',
              },
              suspension: {
                modify: 'Modifier la suspension',
              },
            },
          },
          deactivated: {
            content: 'Désactivation depuis le {date}.',
            actions: {
              revalidation: {
                immediate: 'Réactivation immédiate',
                scheduled: 'Planifier la réactivation',
              },
            },
          },
          deactivationWarning: {
            content:
              "Désactivation aujourd'hui (le {date}). | Désactivation demain (le {date}). | Désactivation dans {count} jours (le {date}).",
            actions: {
              deactivation: {
                immediate: 'Désactivation immédiate',
                modify: 'Modifier la date de désactivation',
              },
            },
          },
        },
        infoTexts: {
          willDeactivate: 'Désactivation prévue le {date}.',
          willSuspend: 'Suspension prévue le {date}.',
          notActivated: 'Activation pas encore effectuée.',
        },
        LifecycleButtonsCard: {
          activation: {
            DropdownButton: {
              title: 'Activation',
              activation: {
                immediate: 'Immédiate',
                scheduled: 'Planifiée',
              },
            },
          },
          suspension: {
            DropdownButton: {
              title: 'Suspension',
              suspension: {
                immediate: 'Immédiate',
                scheduled: 'Planifiée',
              },
            },
          },
          deactivation: {
            DropdownButton: {
              title: 'Désactivation',
              deactivation: {
                immediate: 'Immédiate',
                scheduled: 'Planifiée',
                modify: 'Modifier',
              },
            },
          },
        },
        actions: {
          activation: {
            immediate: {
              ConfirmationDialog: {
                title: 'Activation immédiate',
                ButtonsCard: { confirm: 'Activer', cancel: 'Annuler' },
              },
            },
            scheduled: {
              FormDialog: {
                title: "Planifier l'activation",
                ButtonsCard: {
                  confirm: 'Planifier',
                  confirmLoading: 'Planification...',
                  cancel: 'Annuler',
                },
              },
            },
          },
          suspension: {
            immediate: {
              FormDialog: {
                title: 'Suspension immédiate',
                ButtonsCard: {
                  confirm: 'Suspendre',
                  confirmLoading: 'Suspension...',
                  cancel: 'Annuler',
                },
              },
            },
            scheduled: {
              FormDialog: {
                title: 'Planifier la suspension',
                ButtonsCard: {
                  confirm: 'Planifier',
                  confirmLoading: 'Planification...',
                  cancel: 'Annuler',
                },
              },
            },
            modify: {
              FormDialog: {
                title: 'Modifier la suspension',
                ButtonsCard: {
                  confirm: 'Modifier',
                  confirmLoading: 'Modification...',
                  cancel: 'Annuler',
                },
              },
            },
          },
          deactivation: {
            immediate: {
              FormDialog: {
                title: 'Désactivation immédiate',
                ButtonsCard: {
                  confirm: 'Désactiver',
                  confirmLoading: 'Désactivation...',
                  cancel: 'Annuler',
                },
              },
            },
            scheduled: {
              FormDialog: {
                title: 'Planifier la désactivation',
                ButtonsCard: {
                  confirm: 'Planifier',
                  confirmLoading: 'Planification...',
                  cancel: 'Annuler',
                },
              },
            },
            modify: {
              FormDialog: {
                title: 'Modifier la désactivation',
                ButtonsCard: {
                  confirm: 'Modifier',
                  confirmLoading: 'Modification...',
                  cancel: 'Annuler',
                },
              },
            },
          },
          reactivation: {
            immediate: {
              FormDialog: {
                title: 'Réactivation immédiate',
                ButtonsCard: {
                  confirm: 'Réactiver',
                  confirmLoading: 'Réactivation...',
                  cancel: 'Annuler',
                },
              },
            },
          },
          revalidation: {
            immediate: {
              FormDialog: {
                title: 'Réactivation immédiate',
                ButtonsCard: {
                  confirm: 'Réactiver',
                  confirmLoading: 'Réactivation...',
                  cancel: 'Annuler',
                },
              },
            },
            scheduled: {
              FormDialog: {
                title: 'Planifier la réactivation',
                ButtonsCard: {
                  confirm: 'Planifier',
                  confirmLoading: 'Planification...',
                  cancel: 'Annuler',
                },
              },
            },
          },
        },
      },
    },
  },
  'en-US': {
    '{{ config.instanceId }}': {
      LifecyclePanel: {
        submitSuccess: 'Action completed successfully',
        submitError: 'Error while running the action',
        LifecycleBannersCard: {
          suspended: {
            content: 'Suspended since {date}.',
            contentWithEndDate: 'Suspended from {date} until {endDate}.',
            actions: {
              reactivation: {
                immediate: 'Immediate reactivation',
              },
              suspension: {
                modify: 'Modify the suspension',
              },
            },
          },
          deactivated: {
            content: 'Deactivated since {date}.',
            actions: {
              revalidation: {
                immediate: 'Immediate reactivation',
                scheduled: 'Schedule the reactivation',
              },
            },
          },
          deactivationWarning: {
            content:
              'Deactivated today (on {date}). | Deactivated tomorrow (on {date}). | Deactivated in {count} days (on {date}).',
            actions: {
              deactivation: {
                immediate: 'Immediate deactivation',
                modify: 'Modify the deactivation date',
              },
            },
          },
        },
        infoTexts: {
          willDeactivate: 'Will be deactivated on {date}.',
          willSuspend: 'Will be suspended on {date}.',
          notActivated: 'Not activated yet.',
        },
        LifecycleButtonsCard: {
          activation: {
            DropdownButton: {
              title: 'Activation',
              activation: {
                immediate: 'Immediate',
                scheduled: 'Scheduled',
              },
            },
          },
          suspension: {
            DropdownButton: {
              title: 'Suspension',
              suspension: {
                immediate: 'Immediate',
                scheduled: 'Scheduled',
              },
            },
          },
          deactivation: {
            DropdownButton: {
              title: 'Deactivation',
              deactivation: {
                immediate: 'Immediate',
                scheduled: 'Scheduled',
                modify: 'Modify',
              },
            },
          },
        },
        actions: {
          activation: {
            immediate: {
              ConfirmationDialog: {
                title: 'Immediate activation',
                ButtonsCard: { confirm: 'Activate', cancel: 'Cancel' },
              },
            },
            scheduled: {
              FormDialog: {
                title: 'Schedule the activation',
                ButtonsCard: {
                  confirm: 'Schedule',
                  confirmLoading: 'Scheduling...',
                  cancel: 'Cancel',
                },
              },
            },
          },
          suspension: {
            immediate: {
              FormDialog: {
                title: 'Immediate suspension',
                ButtonsCard: {
                  confirm: 'Suspend',
                  confirmLoading: 'Suspending...',
                  cancel: 'Cancel',
                },
              },
            },
            scheduled: {
              FormDialog: {
                title: 'Schedule the suspension',
                ButtonsCard: {
                  confirm: 'Schedule',
                  confirmLoading: 'Scheduling...',
                  cancel: 'Cancel',
                },
              },
            },
            modify: {
              FormDialog: {
                title: 'Modify the suspension',
                ButtonsCard: {
                  confirm: 'Modify',
                  confirmLoading: 'Modifying...',
                  cancel: 'Cancel',
                },
              },
            },
          },
          deactivation: {
            immediate: {
              FormDialog: {
                title: 'Immediate deactivation',
                ButtonsCard: {
                  confirm: 'Deactivate',
                  confirmLoading: 'Deactivating...',
                  cancel: 'Cancel',
                },
              },
            },
            scheduled: {
              FormDialog: {
                title: 'Schedule the deactivation',
                ButtonsCard: {
                  confirm: 'Schedule',
                  confirmLoading: 'Scheduling...',
                  cancel: 'Cancel',
                },
              },
            },
            modify: {
              FormDialog: {
                title: 'Modify the deactivation',
                ButtonsCard: {
                  confirm: 'Modify',
                  confirmLoading: 'Modifying...',
                  cancel: 'Cancel',
                },
              },
            },
          },
          reactivation: {
            immediate: {
              FormDialog: {
                title: 'Immediate reactivation',
                ButtonsCard: {
                  confirm: 'Reactivate',
                  confirmLoading: 'Reactivating...',
                  cancel: 'Cancel',
                },
              },
            },
          },
          revalidation: {
            immediate: {
              FormDialog: {
                title: 'Immediate reactivation',
                ButtonsCard: {
                  confirm: 'Reactivate',
                  confirmLoading: 'Reactivating...',
                  cancel: 'Cancel',
                },
              },
            },
            scheduled: {
              FormDialog: {
                title: 'Schedule the reactivation',
                ButtonsCard: {
                  confirm: 'Schedule',
                  confirmLoading: 'Scheduling...',
                  cancel: 'Cancel',
                },
              },
            },
          },
        },
      },
    },
  },
};

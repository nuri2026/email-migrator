import { Client as HubSpotClient } from "@hubspot/api-client";
import { AssociationSpecAssociationCategoryEnum } from "@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec";
import { prisma } from "@/lib/prisma";

const RATE_LIMIT_DELAY = 100; // ms between requests

export class HubSpotLoadingService {
  private client: HubSpotClient;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.client = new HubSpotClient({ accessToken });
    this.userId = userId;
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async log(entityType: string, entityId: string, status: 'success' | 'error', message?: string) {
    await (prisma as any).migrationLog.create({
      data: { entityType, entityId, status, message, userId: this.userId }
    }).catch(console.error);
  }

  async syncAll() {
    await this.syncCompanies();
    await this.syncContacts();
    await this.syncDeals();
    await this.syncEngagements();
    await this.rebuildAssociations();
  }

  async syncCompanies() {
    const companies = await (prisma as any).brevoCompany.findMany({
      where: { hubspotId: null, userId: this.userId },
    });

    for (const company of companies) {
      try {
        const hsCompany = await this.client.crm.companies.basicApi.create({
          properties: {
            name: company.name,
            domain: company.domain || undefined,
          },
        });

        if (hsCompany?.id) {
          await (prisma as any).brevoCompany.update({
            where: { id: company.id },
            data: { hubspotId: hsCompany.id },
          });
          await this.log('company', company.brevoId, 'success');
        }
        await this.sleep(RATE_LIMIT_DELAY);
      } catch (error: any) {
        console.error(`Failed to sync company ${company.name}:`, error);
        await this.log('company', company.brevoId, 'error', error.message);
      }
    }
  }

  async syncContacts() {
    const contacts = await (prisma as any).brevoContact.findMany({
      where: { hubspotId: null, userId: this.userId },
    });

    for (const contact of contacts) {
      try {
        // Search for existing contact by email first
        const searchResponse = await this.client.crm.contacts.searchApi.doSearch({
          filterGroups: [{
            filters: [{ propertyName: 'email', operator: 'EQ' as any, value: contact.email }]
          }]
        });

        let hsId = searchResponse.results[0]?.id;

        if (!hsId) {
          const hsContact = await this.client.crm.contacts.basicApi.create({
            properties: {
              email: contact.email,
              firstname: contact.firstName || undefined,
              lastname: contact.lastName || undefined,
            },
          });
          hsId = hsContact.id;
        }

        if (hsId) {
          await (prisma as any).brevoContact.update({
            where: { id: contact.id },
            data: { hubspotId: hsId },
          });
          await this.log('contact', contact.brevoId, 'success');
        }
        await this.sleep(RATE_LIMIT_DELAY);
      } catch (error: any) {
        console.error(`Failed to sync contact ${contact.email}:`, error);
        await this.log('contact', contact.brevoId, 'error', error.message);
      }
    }
  }

  async syncDeals() {
    const deals = await (prisma as any).brevoDeal.findMany({
      where: { hubspotId: null, userId: this.userId },
    });

    for (const deal of deals) {
      try {
        const hsDeal = await this.client.crm.deals.basicApi.create({
          properties: {
            dealname: deal?.name,
            amount: deal?.amount || "0",
            dealstage: deal?.dealStage || "appointmentscheduled",
            pipeline: "default",
            closedate: (deal as any)?.closeDate?.toISOString?.() || undefined,
          },
        });

        if (hsDeal?.id) {
          await prisma.brevoDeal.update({
            where: { id: deal?.id },
            data: { hubspotId: hsDeal.id },
          });
          await this.log('deal', deal.brevoId, 'success');
        }
        await this.sleep(RATE_LIMIT_DELAY);
      } catch (error: any) {
        console.error(`Failed to sync deal ${deal?.name}:`, error);
        await this.log('deal', deal.brevoId, 'error', error.message);
      }
    }
  }

  async syncEngagements() {
    // Sync Notes
    const notes = await (prisma as any).brevoNote.findMany({
      where: { hubspotId: null, userId: this.userId },
    });

    for (const note of notes) {
      try {
        const hsNote = await this.client.crm.objects.notes.basicApi.create({
          properties: {
            hs_note_body: note?.body,
            hs_timestamp: new Date().toISOString(),
          },
        });

        if (hsNote?.id) {
          await prisma.brevoNote.update({
            where: { id: note?.id },
            data: { hubspotId: hsNote.id },
          });
          await this.log('note', note.brevoId, 'success');
        }
        await this.sleep(RATE_LIMIT_DELAY);
      } catch (error: any) {
        console.error(`Failed to sync note:`, error);
        await this.log('note', note.brevoId, 'error', error.message);
      }
    }

    // Sync Tasks
    const tasks = await (prisma as any).brevoTask.findMany({
      where: { hubspotId: null, userId: this.userId },
    });

    for (const task of tasks) {
      try {
        const hsTask = await this.client.crm.objects.tasks.basicApi.create({
          properties: {
            hs_task_subject: task?.name,
            hs_task_status: "NOT_STARTED",
            hs_timestamp: task?.dueDate?.toISOString() || new Date().toISOString(),
          },
        });

        if (hsTask?.id) {
          await prisma.brevoTask.update({
            where: { id: task?.id },
            data: { hubspotId: hsTask.id },
          });
          await this.log('task', task.brevoId, 'success');
        }
        await this.sleep(RATE_LIMIT_DELAY);
      } catch (error: any) {
        console.error(`Failed to sync task ${task?.name}:`, error);
        await this.log('task', task.brevoId, 'error', error.message);
      }
    }
  }

  async rebuildAssociations() {
    // Associate Notes to Deals
    const notes = await (prisma as any).brevoNote.findMany({
      where: { 
        hubspotId: { not: null },
        dealId: { not: null },
        userId: this.userId
      },
      include: { deal: true }
    });

    for (const note of notes) {
      if (note?.hubspotId && note?.deal?.hubspotId) {
        try {
          await this.client.crm.associations.v4.basicApi.create(
            'notes',
            note.hubspotId,
            'deals',
            note.deal.hubspotId,
            [
              {
                associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                associationTypeId: 214 // note_to_deal
              }
            ]
          );
          await this.sleep(RATE_LIMIT_DELAY);
        } catch (error: any) {
          console.error(`Failed to associate note to deal:`, error);
        }
      }
    }

    // Associate Tasks to Deals
    const tasks = await (prisma as any).brevoTask.findMany({
      where: { 
        hubspotId: { not: null },
        dealId: { not: null },
        userId: this.userId
      },
      include: { deal: true }
    });

    for (const task of tasks) {
      if (task?.hubspotId && task?.deal?.hubspotId) {
        try {
          await this.client.crm.associations.v4.basicApi.create(
            'tasks',
            task.hubspotId,
            'deals',
            task.deal.hubspotId,
            [
              {
                associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                associationTypeId: 216 // task_to_deal
              }
            ]
          );
          await this.sleep(RATE_LIMIT_DELAY);
        } catch (error: any) {
          console.error(`Failed to associate task to deal:`, error);
        }
      }
    }

    // Associate Deals to Companies
    const dealsWithCompany = await (prisma as any).brevoDeal.findMany({
      where: {
        hubspotId: { not: null },
        companyId: { not: null },
        userId: this.userId
      },
      include: { company: true }
    });

    for (const deal of dealsWithCompany) {
      if (deal?.hubspotId && deal?.company?.hubspotId) {
        try {
          await this.client.crm.associations.v4.basicApi.create(
            'deals',
            deal.hubspotId,
            'companies',
            deal.company.hubspotId,
            [
              {
                associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                associationTypeId: 5 // deal_to_company
              }
            ]
          );
          await this.sleep(RATE_LIMIT_DELAY);
        } catch (error: any) {
          console.error(`Failed to associate deal to company:`, error);
        }
      }
    }

    // Associate Deals to Contacts
    const dealsWithContacts = await (prisma as any).brevoDeal.findMany({
      where: { hubspotId: { not: null }, userId: this.userId },
      include: { contacts: true }
    });

    for (const deal of dealsWithContacts) {
      if (deal?.hubspotId && deal?.contacts?.length > 0) {
        for (const contact of deal.contacts) {
          if (contact.hubspotId) {
            try {
              await this.client.crm.associations.v4.basicApi.create(
                'deals',
                deal.hubspotId,
                'contacts',
                contact.hubspotId,
                [
                  {
                    associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                    associationTypeId: 3 // deal_to_contact
                  }
                ]
              );
              await this.sleep(RATE_LIMIT_DELAY);
            } catch (error: any) {
              console.error(`Failed to associate deal to contact:`, error);
            }
          }
        }
      }
    }
  }
}

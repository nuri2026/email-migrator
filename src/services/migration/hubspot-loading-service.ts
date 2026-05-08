import { Client as HubSpotClient } from "@hubspot/api-client";
import { AssociationSpecAssociationCategoryEnum } from "@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec";
import { prisma } from "@/lib/prisma";

export class HubSpotLoadingService {
  private client: HubSpotClient;

  constructor(accessToken: string) {
    this.client = new HubSpotClient({ accessToken });
  }

  async syncAll() {
    await this.syncDeals();
    await this.syncEngagements();
    await this.rebuildAssociations();
  }

  async syncDeals() {
    const deals = await prisma.brevoDeal.findMany({
      where: { hubspotId: null },
    });

    for (const deal of deals) {
      try {
        const hsDeal = await this.client.crm.deals.basicApi.create({
          properties: {
            dealname: deal?.name,
            amount: deal?.amount || "0",
            dealstage: "appointmentscheduled", // Default stage from requirements
            pipeline: "default",
          },
        });

        if (hsDeal?.id) {
          await prisma.brevoDeal.update({
            where: { id: deal?.id },
            data: { hubspotId: hsDeal.id },
          });
        }
      } catch (error) {
        console.error(`Failed to sync deal ${deal?.name}:`, error);
      }
    }
  }

  async syncEngagements() {
    // Sync Notes
    const notes = await prisma.brevoNote.findMany({
      where: { hubspotId: null },
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
        }
      } catch (error) {
        console.error(`Failed to sync note:`, error);
      }
    }

    // Sync Tasks
    const tasks = await prisma.brevoTask.findMany({
      where: { hubspotId: null },
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
        }
      } catch (error) {
        console.error(`Failed to sync task ${task?.name}:`, error);
      }
    }
  }

  async rebuildAssociations() {
    // Associate Notes to Deals
    const notes = await prisma.brevoNote.findMany({
      where: { 
        hubspotId: { not: null },
        dealId: { not: null }
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
        } catch (error) {
          console.error(`Failed to associate note to deal:`, error);
        }
      }
    }

    // Associate Tasks to Deals
    const tasks = await prisma.brevoTask.findMany({
      where: { 
        hubspotId: { not: null },
        dealId: { not: null }
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
        } catch (error) {
          console.error(`Failed to associate task to deal:`, error);
        }
      }
    }
  }
}

import { BrevoClient } from "@getbrevo/brevo";
import { prisma } from "@/lib/prisma";

export class BrevoExtractionService {
  private client: BrevoClient;

  constructor(apiKey: string) {
    this.client = new BrevoClient({ apiKey });
  }

  async extractAll() {
    await this.extractCompanies();
    await this.extractContacts();
    await this.extractDeals();
    await this.extractNotes();
    await this.extractTasks();
  }

  async extractCompanies() {
    let page = 1;
    const limit = 50;
    
    while (true) {
      const response = await this.client.companies.getAllCompanies({ limit, page, sort: 'desc' });
      const items = (response as any)?.items || (response as any)?.data?.items || (response as any)?.companies;
      if (!items || items.length === 0) break;

      for (const company of items) {
        await (prisma as any).brevoCompany.upsert({
          where: { brevoId: company?.id },
          update: {
            name: company?.attributes?.name || company?.name || 'Untitled Company',
            domain: company?.attributes?.domain || company?.domain,
            rawJson: company as any,
          },
          create: {
            brevoId: company?.id,
            name: company?.attributes?.name || company?.name || 'Untitled Company',
            domain: company?.attributes?.domain || company?.domain,
            rawJson: company as any,
          },
        });
      }
      page++;
    }
  }

  async extractContacts() {
    let offset = 0;
    const limit = 50;
    
    while (true) {
      const response = await this.client.contacts.getContacts({ limit, offset, sort: 'desc' });
      const items = (response as any)?.contacts || (response as any)?.items || (response as any)?.data?.contacts;
      if (!items || items.length === 0) break;

      for (const contact of items) {
        if (!contact?.email) continue;
        
        await (prisma as any).brevoContact.upsert({
          where: { email: contact.email },
          update: {
            brevoId: contact?.id?.toString(),
            firstName: contact?.attributes?.FIRSTNAME || contact?.firstName,
            lastName: contact?.attributes?.LASTNAME || contact?.lastName,
            rawJson: contact as any,
          },
          create: {
            brevoId: contact?.id?.toString(),
            email: contact.email,
            firstName: contact?.attributes?.FIRSTNAME || contact?.firstName,
            lastName: contact?.attributes?.LASTNAME || contact?.lastName,
            rawJson: contact as any,
          },
        });
      }
      offset += limit;
    }
  }

  async extractDeals() {
    let offset = 0;
    const limit = 50;
    
    while (true) {
      const response = await this.client.deals.getAllDeals({ limit, offset, sort: 'desc' });
      const items = (response as any)?.items || (response as any)?.data?.items;
      if (!items || items.length === 0) break;

      for (const deal of items) {
        await (prisma as any).brevoDeal.upsert({
          where: { brevoId: deal?.id },
          update: {
            name: deal?.name || deal?.attributes?.name || 'Untitled Deal',
            amount: (deal?.amount || deal?.attributes?.amount)?.toString(),
            dealStage: deal?.dealStage || deal?.attributes?.dealStage,
            companyName: deal?.companyName || deal?.attributes?.companyName,
            closeDate: (deal?.closeDate || deal?.attributes?.closeDate) ? new Date(deal.closeDate || deal.attributes.closeDate) : null,
            rawJson: deal as any,
            companyId: deal?.linkedCompaniesIds?.[0] || deal?.attributes?.linkedCompaniesIds?.[0],
          },
          create: {
            brevoId: deal?.id,
            name: deal?.name || deal?.attributes?.name || 'Untitled Deal',
            amount: (deal?.amount || deal?.attributes?.amount)?.toString(),
            dealStage: deal?.dealStage || deal?.attributes?.dealStage,
            companyName: deal?.companyName || deal?.attributes?.companyName,
            closeDate: (deal?.closeDate || deal?.attributes?.closeDate) ? new Date(deal.closeDate || deal.attributes.closeDate) : null,
            rawJson: deal as any,
            companyId: deal?.linkedCompaniesIds?.[0] || deal?.attributes?.linkedCompaniesIds?.[0],
          },
        });

        // Handle many-to-many contact associations
        const contactIds = deal?.linkedContactsIds || deal?.attributes?.linkedContactsIds;
        if (Array.isArray(contactIds) && contactIds.length > 0) {
          for (const cId of contactIds) {
            await (prisma as any).brevoDeal.update({
              where: { brevoId: deal.id },
              data: {
                contacts: {
                  connect: { brevoId: cId.toString() }
                }
              }
            }).catch(() => {/* Contact might not be extracted yet */});
          }
        }
      }
      offset += limit;
    }
  }

  async extractNotes() {
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await this.client.notes.getAllNotes({ limit, offset, sort: 'desc' });
      // Notes usually returns an array directly in v5
      const items = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.items;
      if (!items || items.length === 0) break;

      for (const note of items) {
        await prisma.brevoNote.upsert({
          where: { brevoId: note?.id },
          update: {
            body: note?.body || '',
            dealId: note?.dealIds?.[0], // Taking the first associated deal
            rawJson: note as any,
          },
          create: {
            brevoId: note?.id,
            body: note?.body || '',
            dealId: note?.dealIds?.[0],
            rawJson: note as any,
          },
        });
      }
      offset += limit;
    }
  }

  async extractTasks() {
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await this.client.tasks.getAllTasks({ limit, offset, sort: 'desc' });
      const items = (response as any)?.items || (response as any)?.data?.items;
      if (!items || items.length === 0) break;

      for (const task of items) {
        await prisma.brevoTask.upsert({
          where: { brevoId: task?.id },
          update: {
            name: task?.name || 'Untitled Task',
            dueDate: task?.dueDate ? new Date(task.dueDate) : null,
            dealId: task?.dealIds?.[0],
            rawJson: task as any,
          },
          create: {
            brevoId: task?.id,
            name: task?.name || 'Untitled Task',
            dueDate: task?.dueDate ? new Date(task.dueDate) : null,
            dealId: task?.dealIds?.[0],
            rawJson: task as any,
          },
        });
      }
      offset += limit;
    }
  }
}

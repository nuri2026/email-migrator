import { BrevoClient } from "@getbrevo/brevo";
import { prisma } from "@/lib/prisma";

export class BrevoExtractionService {
  private client: BrevoClient;

  constructor(apiKey: string) {
    this.client = new BrevoClient({ apiKey });
  }

  async extractAll() {
    await this.extractDeals();
    await this.extractNotes();
    await this.extractTasks();
  }

  async extractDeals() {
    let offset = 0;
    const limit = 50;
    
    while (true) {
      const response = await this.client.deals.getAllDeals({ limit, offset, sort: 'desc' });
      const items = (response as any)?.items || (response as any)?.data?.items;
      if (!items || items.length === 0) break;

      for (const deal of items) {
        await prisma.brevoDeal.upsert({
          where: { brevoId: deal?.id },
          update: {
            name: deal?.name || 'Untitled Deal',
            amount: deal?.amount?.toString(),
            dealStage: deal?.dealStage,
            rawJson: deal as any,
          },
          create: {
            brevoId: deal?.id,
            name: deal?.name || 'Untitled Deal',
            amount: deal?.amount?.toString(),
            dealStage: deal?.dealStage,
            rawJson: deal as any,
          },
        });
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

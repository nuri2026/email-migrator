# Next.js Migration App Plan: Brevo to HubSpot (v2)

This document details the technical implementation for the migration tool using the [my-nextjs-template](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/README.md).

## 1. Tech Stack Integration

- **Framework**: Next.js 15.2.3 (App Router)
- **Auth**: Better Auth (configured in [auth.ts](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/lib/auth.ts))
- **Database**: PostgreSQL via Prisma ORM
- **SDKs**:
  - `@getbrevo/brevo` (v5) for data extraction.
  - `@hubspot/api-client` (v11+) for data loading.
- **UI**: shadcn/ui + Tailwind CSS + TanStack Query.

## 2. Database Schema Extensions

Add the following models to [schema.prisma](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/prisma/schema.prisma):

```prisma
model ApiConfiguration {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  brevoApiKey     String?
  hubspotToken    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model BrevoDeal {
  id              String   @id @default(uuid())
  brevoId         String   @unique
  name            String
  amount          String?
  dealStage       String?
  rawJson         Json
  hubspotId       String?  // Linked after migration
  createdAt       DateTime @default(now())
  notes           BrevoNote[]
  tasks           BrevoTask[]
}

model BrevoNote {
  id              String   @id @default(uuid())
  brevoId         String   @unique
  body            String
  dealId          String?
  deal            BrevoDeal? @relation(fields: [dealId], references: [brevoId])
  hubspotId       String?
  rawJson         Json
  createdAt       DateTime @default(now())
}

model BrevoTask {
  id              String   @id @default(uuid())
  brevoId         String   @unique
  name            String
  dueDate         DateTime?
  dealId          String?
  deal            BrevoDeal? @relation(fields: [dealId], references: [brevoId])
  hubspotId       String?
  rawJson         Json
  createdAt       DateTime @default(now())
}
```

## 3. Backend Implementation (Service Layer)

Create dedicated services in `src/services/migration/`:

### A. Brevo Extraction Service

- **Methods**: `fetchDeals()`, `fetchNotes()`, `fetchTasks()`.
- **Logic**: Use the `crmDealsGet` (etc.) methods from `@getbrevo/brevo`. Implement pagination with `limit` and `offset`. Store raw data and associations in the local DB.

### B. HubSpot Loading Service

- **Methods**: `syncDeals()`, `syncEngagements()`, `createAssociations()`.
- **Logic**:
  1. **Sync Deals**: Iterate through `BrevoDeal` table. Use `hubspotClient.crm.deals.basicApi.create()`. Save the returned HubSpot ID.
  2. **Sync Notes/Tasks**: Create objects in HubSpot using `crm.objects.notes` and `crm.objects.tasks`.
  3. **Rebuild Associations**: For each Note/Task with a `dealId`, find the mapped HubSpot ID and call `hubspotClient.crm.associations.v4.basicApi.create()`.

## 4. API Routes

- `POST /api/migration/config`: Save/Update encrypted API keys.
- `POST /api/migration/extract`: Trigger extraction from Brevo.
- `GET /api/migration/stats`: Progress of local storage.
- `POST /api/migration/load`: Trigger sequential upload to HubSpot.
- `DELETE /api/migration/wipe`: Clear staged data from the database.
- `GET /api/migration/data`: Retrieve staged data for preview.

## 5. UI Components (Dashboard)

Located in `src/app/migration/`:

- **ConfigForm**: Secure form to input Brevo/HubSpot keys.
- **ExtractionStats**: Visual cards showing counts of staged records.
- **DataTable**: Preview of data fetched from Brevo using shadcn `Table`.
- **MigrationTrigger**: Action buttons and logs for the sync process.

## 6. Migration Sequence & Association Logic

1. **Deals First**: Critical for parent-child relationship.
2. **Notes/Tasks Second**: Create the records but they remain orphans initially.
3. **Association Batching**: Batch create associations using the v4 API to minimize rate limits.
   - Note to Deal: `note_to_deal` (type 214)
   - Task to Deal: `task_to_deal` (type 216)

## 7. Phase 4: Data Preview & Management (In Progress)

- **Detailed Preview**: Implement tabbed data tables to inspect staged Deals, Notes, and Tasks.
- **Wipe Data**: Provide an administrative action to clear staged records.
- **Sync Logging**: Granular UI feedback during the HubSpot import phase.

## 8. Security & Compliance

- Better Auth ensures only authenticated users access the migration dashboard.
- API keys are linked to the user account in the database.
- Data can be wiped locally after sync is verified.

## Reference Documentation

- [HubSpot SDK Map](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/user_requriments/hubspot-javascript-sdk.md)
- [Brevo SDK Map](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/user_requriments/brevo-api-javascript-sdk.md)
- [German Requirements](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/user_requriments/user_reqiremnts-german.md)
- [English Requirements](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/user_requriments/user_requiremnts_english.md)

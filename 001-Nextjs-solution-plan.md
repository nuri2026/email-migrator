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

## 7. Implementation Progress & Status

- **Phase 1: Setup & API Config**: ✅ Completed
  - [schema.prisma](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/prisma/schema.prisma) updated with migration models.
  - [ConfigForm.tsx](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/app/migration/_components/ConfigForm.tsx) implemented for API key management.
- **Phase 2: Brevo Extraction**: ✅ Completed
  - [brevo-extraction-service.ts](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/services/migration/brevo-extraction-service.ts) implemented with pagination support for Deals, Notes, and Tasks.
- **Phase 3: HubSpot Loading**: ✅ Completed
  - [hubspot-loading-service.ts](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/services/migration/hubspot-loading-service.ts) implemented with HubSpot v4 Association API support.
- **Phase 4: Data Preview & Management**: ✅ Completed
  - [DataPreview.tsx](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/app/migration/_components/DataPreview.tsx) implemented with tabbed views for staged data.
  - [MigrationDashboard.tsx](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/app/migration/_components/MigrationDashboard.tsx) implemented for process control.
- **Phase 5: UI Integration**: ✅ Completed
  - [page.tsx](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/app/migration/page.tsx) created to host the migration dashboard.
- **Phase 6: Enhanced Associations**: ✅ Completed
  - Added `BrevoCompany` and `BrevoContact` models to [schema.prisma](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/prisma/schema.prisma).
  - Implemented extraction for Companies and Contacts in [brevo-extraction-service.ts](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/services/migration/brevo-extraction-service.ts).
  - Implemented sync and matching logic in [hubspot-loading-service.ts](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/services/migration/hubspot-loading-service.ts).
- **Phase 7: Robustness & Logging**: ✅ Completed
  - Implemented rate limiting (100ms delay) in [hubspot-loading-service.ts](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/services/migration/hubspot-loading-service.ts).
  - Added `MigrationLog` model to track per-record success/failure.
  - Updated [MigrationDashboard.tsx](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/app/migration/_components/MigrationDashboard.tsx) with detailed entity stats.
- **Phase 8: Data Transformation & UI Polish**: ✅ Completed
  - Expanded [DataPreview.tsx](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/app/migration/_components/DataPreview.tsx) with tabbed views for Companies, Contacts, and Migration Logs.
  - Implemented relation-aware previews in the UI (e.g., showing linked contacts and companies for each deal).
  - Enhanced [route.ts](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/src/app/api/migration/data/route.ts) to support deep fetching of associated entities for preview.

## 9. Next Steps: Phase 9 - Final Validation & Cleanup

- Better Auth ensures only authenticated users access the migration dashboard.
- API keys are linked to the user account in the database.
- Data can be wiped locally after sync is verified.

## Reference Documentation

- [HubSpot SDK Map](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/user_requriments/hubspot-javascript-sdk.md)
- [Brevo SDK Map](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/user_requriments/brevo-api-javascript-sdk.md)
- [German Requirements](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/user_requriments/user_reqiremnts-german.md)
- [English Requirements](file:///home/nuriadmin/Documents/Projects/eagle/data_migration/emial-migrator/user_requriments/user_requiremnts_english.md)

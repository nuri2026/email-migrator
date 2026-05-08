# HubSpot API & JavaScript SDK Map

This document provides a detailed map of the HubSpot CRM API and its JavaScript SDK for data migration purposes.

## Official Resources

- [HubSpot Developer Portal](https://developers.hubspot.com/)
- [Node.js SDK GitHub](https://github.com/HubSpot/hubspot-api-nodejs)
- [API Reference Index](https://developers.hubspot.com/docs/api-reference/latest)

## Installation

```bash
npm install @hubspot/api-client
```

## Authentication

HubSpot uses Private App Access Tokens for authentication.

```javascript
const { Client } = require("@hubspot/api-client");
const hubspotClient = new Client({ accessToken: "YOUR_ACCESS_TOKEN" });
```

## CRM Object Endpoints & SDK Methods

### 1. Deals

- **Endpoint:** `POST /crm/v3/objects/deals`
- **SDK Method:** `hubspotClient.crm.deals.basicApi.create(dealBody)`
- **Batch Endpoint:** `POST /crm/v3/objects/deals/batch/create`
- **SDK Method:** `hubspotClient.crm.deals.batchApi.create({ inputs: [...] })`

**Example:**

```javascript
const dealObj = {
  properties: {
    dealname: "Project Eagle Migration",
    amount: "5000",
    dealstage: "appointmentscheduled",
    pipeline: "default",
  },
};
const result = await hubspotClient.crm.deals.basicApi.create(dealObj);
```

### 2. Tasks

- **Endpoint:** `POST /crm/v3/objects/tasks`
- **SDK Method:** `hubspotClient.crm.objects.tasks.basicApi.create(taskBody)`

**Example:**

```javascript
const taskObj = {
  properties: {
    hs_task_subject: "Follow up on migration",
    hs_task_body: "Ensure all notes are synced",
    hs_task_status: "NOT_STARTED",
    hs_timestamp: "2024-05-15T12:00:00Z",
  },
};
const result = await hubspotClient.crm.objects.tasks.basicApi.create(taskObj);
```

### 3. Notes (Engagements)

- **Endpoint:** `POST /crm/v3/objects/notes`
- **SDK Method:** `hubspotClient.crm.objects.notes.basicApi.create(noteBody)`

**Example:**

```javascript
const noteObj = {
  properties: {
    hs_note_body: "Customer requested specific field mapping.",
  },
};
const result = await hubspotClient.crm.objects.notes.basicApi.create(noteObj);
```

### 4. Associations

To link a Note or Task to a Deal.

- **Endpoint:** `POST /crm/v4/associations/{fromObjectType}/{toObjectType}/batch/create`
- **SDK Method:** `hubspotClient.crm.associations.v4.basicApi.create(fromObjectType, fromObjectId, toObjectType, toObjectId, [{ associationCategory, associationTypeId }])`

**Example (Linking Note to Deal):**

```javascript
await hubspotClient.crm.associations.v4.basicApi.create(
  "notes",
  noteId,
  "deals",
  dealId,
  [
    {
      associationCategory: "HUBSPOT_DEFINED",
      associationTypeId: 214, // note_to_deal
    },
  ],
);
```

## Common Scopes Required

- `crm.objects.deals.write`
- `crm.objects.contacts.write`
- `crm.objects.companies.write`
- `crm.objects.owners.read`
- `crm.objects.notes.write`
- `crm.objects.tasks.write`

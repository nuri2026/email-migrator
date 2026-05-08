# Brevo API & JavaScript SDK Map

This document provides a detailed map of the Brevo CRM API and its JavaScript SDK for data extraction purposes.

## Official Resources

- [Brevo Developer Portal](https://developers.brevo.com/)
- [Node.js SDK (v5) Reference](https://developers.brevo.com/docs/node-js-sdk)
- [API Reference Index](https://developers.brevo.com/reference)

## Installation

```bash
npm install @getbrevo/brevo
```

## Authentication

Brevo uses an API Key passed in the headers.

```javascript
const { BrevoClient } = require("@getbrevo/brevo");
const brevo = new BrevoClient({ apiKey: "YOUR_API_KEY" });
```

## CRM Object Endpoints & SDK Methods (Export focus)

### 1. Deals

- **Endpoint:** `GET /crm/deals`
- **SDK Method:** `brevo.deals.crmDealsGet(limit, offset, sort, sortBy, filters)`
- **Response Structure:** Returns a list of deal objects.

**Example:**

```javascript
const deals = await brevo.deals.crmDealsGet(50, 0, "desc", "createdAt");
deals.items.forEach((deal) => {
  console.log(`Deal Name: ${deal.name}, Amount: ${deal.amount}`);
});
```

### 2. Tasks

- **Endpoint:** `GET /crm/tasks`
- **SDK Method:** `brevo.tasks.crmTasksGet(limit, offset, sort, sortBy, filters)`
- **Response Structure:** Returns a list of task objects.

**Example:**

```javascript
const tasks = await brevo.tasks.crmTasksGet(50, 0, "desc", "createdAt");
tasks.items.forEach((task) => {
  console.log(`Task: ${task.name}, Due Date: ${task.dueDate}`);
});
```

### 3. Notes

- **Endpoint:** `GET /crm/notes`
- **SDK Method:** `brevo.notes.crmNotesGet(limit, offset, sort, sortBy, filters)`
- **Response Structure:** Returns a list of note objects.

**Example:**

```javascript
const notes = await brevo.notes.crmNotesGet(50, 0, "desc", "createdAt");
notes.items.forEach((note) => {
  console.log(`Note Content: ${note.body}`);
  // Note: Check dealIds in the note object to find associated deals
  if (note.dealIds && note.dealIds.length > 0) {
    console.log(`Associated Deals: ${note.dealIds.join(", ")}`);
  }
});
```

## Pagination Strategy

Brevo uses `limit` and `offset` for pagination. To export all data, use a loop:

```javascript
let offset = 0;
const limit = 50;
let allItems = [];

while (true) {
  const response = await brevo.deals.crmDealsGet(limit, offset);
  if (!response.items || response.items.length === 0) break;
  allItems.push(...response.items);
  offset += limit;
}
```

## Key Attributes to Extract

- **Deals:** `id`, `name`, `amount`, `dealStage`, `dealOwner`, `createdAt`, `linkedContactsIds`, `linkedCompaniesIds`.
- **Tasks:** `id`, `name`, `body`, `dueDate`, `status`, `dealIds`, `contactIds`.
- **Notes:** `id`, `body`, `dealIds`, `contactIds`, `createdAt`.

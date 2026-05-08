# English translation of user requirements

Nuri Lacka <nurilacka@gmail.com>
2:04 PM (0 minutes ago)
to nurilacka2018

Hi Stijepan, maybe it wouldn't be such a big deal for the developers to connect the data.

According to AI

To migrate all remaining data (deals, tasks, notes) from Brevo to HubSpot, we must consider the dependencies between objects. First, the deals must exist in HubSpot so that we can then "attach" tasks and notes to them.

**Prerequisites**

- **HubSpot Private App Token**: Create a Private App in HubSpot and activate the scopes `crm.objects.deals.write`, `crm.objects.contacts.write`, `crm.objects.companies.write`, and `crm.objects.owners.read`.
- **Mapping**: Contacts must already exist in HubSpot. HubSpot uses the email address as a unique identifier to automatically assign deals.

**The Migration Script**
This Python script automates the export from Brevo and the import into HubSpot for deals and notes.

```python
import requests
import time

# CONFIGURATION
BREVO_API_KEY = "YOUR_BREVO_API_KEY"
HUBSPOT_TOKEN = "YOUR_HUBSPOT_TOKEN"

HEADERS_BREVO = {"accept": "application/json", "api-key": BREVO_API_KEY}
HEADERS_HS = {"Authorization": f"Bearer {HUBSPOT_TOKEN}", "Content-Type": "application/json"}

def get_brevo_all(endpoint):
    items = []
    offset = 0
    while True:
        url = f"https://api.brevo.com/v3/{endpoint}?limit=50&offset={offset}"
        res = requests.get(url, headers=HEADERS_BREVO).json()
        data = res.get('items', res) if isinstance(res, dict) else res
        if not data: break
        items.extend(data)
        offset += 50
        time.sleep(0.1)
    return items

def migrate_full():
    # 1. Fetch Deals from Brevo
    print("Fetching deals from Brevo...")
    deals = get_brevo_all("crm/deals")

    for deal in deals:
        # Create HubSpot Deal
        hs_deal = {
            "properties": {
                "dealname": deal.get("name"),
                "amount": str(deal.get("amount", 0)),
                "dealstage": "appointmentscheduled", # Internal ID of your HubSpot stage
                "pipeline": "default"
            }
        }
        res_hs = requests.post("https://hubapi.com", json=hs_deal, headers=HEADERS_HS)

        if res_hs.status_code == 201:
            hs_id = res_hs.json()['id']
            print(f"Deal '{deal.get('name')}' migrated (HS-ID: {hs_id})")

            # 2. Transfer notes for this deal
            notes = get_brevo_all("crm/notes")
            for note in notes:
                if deal.get("id") in note.get("dealIds", []):
                    note_payload = {"properties": {"hs_note_body": note.get("body")}}
                    res_note = requests.post("https://hubapi.com", json=note_payload, headers=HEADERS_HS)
                    if res_note.status_code == 201:
                        note_id = res_note.json()['id']
                        # Create association
                        assoc = {"inputs": [{"from": {"id": note_id}, "to": {"id": hs_id}, "type": "note_to_deal"}]}
                        requests.post("https://hubapi.com", json=assoc, headers=HEADERS_HS)

if __name__ == "__main__":
    migrate_full()
# etc....
```

**Important steps for you:**

- **Deal Stages**: HubSpot uses internal names like `appointmentscheduled` instead of "Appointment scheduled". Check your IDs in the HubSpot Deal settings.
- **Tasks**: You can retrieve these from Brevo via the `crm/tasks` endpoint and create them as `objects/tasks` in HubSpot, similar to the notes.
- **Rate Limits**: HubSpot allows approx. 10–150 requests per second. For very large amounts of data, you should include `time.sleep(0.2)` in the loop.

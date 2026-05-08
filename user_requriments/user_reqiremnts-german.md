Nuri Lacka <nurilacka@gmail.com>
2:04 PM (0 minutes ago)
to nurilacka2018

Hallo Stijepan, ev. wäre es für die Entwickler gar nicht so ein Ding die daten anzubinden.

Gem KI

alle verbleibenden Daten (Deals, Aufgaben, Notizen) von Brevo nach HubSpot zu migrieren, müssen wir die Abhängigkeiten zwischen den Objekten beachten. Zuerst müssen die Deals in HubSpot existieren, damit wir danach Aufgaben und Notizen an sie „anhängen“ können.VoraussetzungenHubSpot Private App Token: Erstelle eine Private App in HubSpot und aktiviere die Scopes crm.objects.deals.write, crm.objects.contacts.write, crm.objects.companies.write und crm.objects.owners.read.Mapping: Die Kontakte müssen bereits in HubSpot vorhanden sein. HubSpot nutzt die E-Mail-Adresse als eindeutige Kennung, um Deals automatisch zuzuordnen.Das Migrations-SkriptDieses Python-Skript automatisiert den Export aus Brevo und den Import in HubSpot für Deals und Notizen.

import requests
import time

# KONFIGURATION

BREVO_API_KEY = "DEIN_BREVO_API_KEY"
HUBSPOT_TOKEN = "DEIN_HUBSPOT_TOKEN"

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

def migrate_full(): # 1. Deals aus Brevo holen
print("Hole Deals aus Brevo...")
deals = get_brevo_all("crm/deals")

    for deal in deals:
        # HubSpot Deal erstellen
        hs_deal = {
            "properties": {
                "dealname": deal.get("name"),
                "amount": str(deal.get("amount", 0)),
                "dealstage": "appointmentscheduled", # Interne ID deiner HubSpot-Phase
                "pipeline": "default"
            }
        }
        res_hs = requests.post("https://hubapi.com", json=hs_deal, headers=HEADERS_HS)

        if res_hs.status_code == 201:
            hs_id = res_hs.json()['id']
            print(f"Deal '{deal.get('name')}' migriert (HS-ID: {hs_id})")

            # 2. Notizen zu diesem Deal übertragen
            notes = get_brevo_all("crm/notes")
            for note in notes:
                if deal.get("id") in note.get("dealIds", []):
                    note_payload = {"properties": {"hs_note_body": note.get("body")}}
                    res_note = requests.post("https://hubapi.com", json=note_payload, headers=HEADERS_HS)
                    if res_note.status_code == 201:
                        note_id = res_note.json()['id']
                        # Verknüpfung erstellen
                        assoc = {"inputs": [{"from": {"id": note_id}, "to": {"id": hs_id}, "type": "note_to_deal"}]}
                        requests.post("https://hubapi.com", json=assoc, headers=HEADERS_HS)

if **name** == "**main**":
migrate_full()
usw....

Wichtige Schritte für dich:Deal-Phasen: HubSpot nutzt interne Namen wie appointmentscheduled statt "Termin vereinbart". Prüfe deine IDs in den HubSpot Deal-Einstellungen.Aufgaben (Tasks): Diese kannst du analog zu den Notizen über den Endpunkt crm/tasks in Brevo abrufen und als objects/tasks in HubSpot anlegen.Rate Limits: HubSpot erlaubt ca. 10–150 Anfragen pro Sekunde. Bei sehr großen Datenmengen solltest du time.sleep(0.2) in die Schleife einbauen.

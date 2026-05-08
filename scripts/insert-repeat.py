#!/usr/bin/env python3
"""
Bulk insert repeat SKUs from CSV into the production API.
Usage: python3 scripts/insert-repeat.py
Place the CSV file at: scripts/repeat-data.csv
"""

import csv, json, re, urllib.request, urllib.error, sys, os

API_URL = "https://returns.snitch-workflow.com/api/skus"
API_KEY = "Snitch@Internal2026"

def extract_image_url(html):
    m = re.search(r'src=["\']([^"\']+)["\']', html)
    return m.group(1) if m else None

def to_num(val):
    if val is None or str(val).strip() == '':
        return None
    try:
        return float(str(val).replace('%', '').strip())
    except ValueError:
        return None

def to_int(val):
    n = to_num(val)
    return int(n) if n is not None else None

csv_path = os.path.join(os.path.dirname(__file__), 'repeat-data.csv')
if not os.path.exists(csv_path):
    print(f"ERROR: CSV not found at {csv_path}")
    print("Save the CSV file as scripts/repeat-data.csv and rerun.")
    sys.exit(1)

rows = []
with open(csv_path, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        image_url = extract_image_url(row.get('IMAGE', ''))
        vendor = (row.get('VENDOR') or '').strip() or None
        category = (row.get('CATEGORY') or '').strip() or None
        l1 = (row.get('l1-category') or '').strip() or None

        rows.append({
            "sku_group":        row['SKU_GROUP'].strip(),
            "category":         category,
            "l1_category":      l1,
            "vendor":           vendor,
            "return_pct":       to_num(row.get('RETURN_PCT')),
            "online_inventory": to_int(row.get('ONLINE_INVENTORY')),
            "total_inventory":  to_int(row.get('TOTAL_INVENTORY')),
            "image_url":        image_url,
            "type":             "repeat",
            "xs_return":        to_int(row.get('XS_RETURN')),
            "s_return":         to_int(row.get('S_RETURN')),
            "m_return":         to_int(row.get('M_RETURN')),
            "l_return":         to_int(row.get('L_RETURN')),
            "xl_return":        to_int(row.get('XL_RETURN')),
            "xxl_return":       to_int(row.get('XXL_RETURN')),
            "xl3_return":       to_int(row.get('XL3_RETURN')),
            "xl4_return":       to_int(row.get('XL4_RETURN')),
            "xl5_return":       to_int(row.get('XL5_RETURN')),
            "xl6_return":       to_int(row.get('XL6_RETURN')),
        })

print(f"Parsed {len(rows)} rows. Sending to API...")

payload = json.dumps(rows).encode('utf-8')
req = urllib.request.Request(
    API_URL,
    data=payload,
    headers={
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        print(f"SUCCESS: inserted {len(result)} SKUs.")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"ERROR {e.code}: {body}")
    sys.exit(1)

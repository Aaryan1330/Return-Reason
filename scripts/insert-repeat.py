#!/usr/bin/env python3
"""
Bulk insert repeat SKUs from CSV into the production API.
Usage: python3 scripts/insert-repeat.py
Place the CSV file at: scripts/repeat-data.csv
"""

import csv, json, re, urllib.request, urllib.error, sys, os

API_BASE = "https://returns.snitch-workflow.com/api/skus"
API_KEY  = "Snitch@Internal2026"

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
    sys.exit(1)

# ── Step 1: Delete all existing repeat products ───────────────────────────────
print("Deleting existing repeat products...")
req = urllib.request.Request(
    API_BASE,
    headers={'x-api-key': API_KEY},
    method='DELETE'
)
try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        print(f"Deleted {result.get('deleted', 0)} existing repeat SKUs.")
except urllib.error.HTTPError as e:
    print(f"ERROR during delete {e.code}: {e.read().decode()}")
    sys.exit(1)

# ── Step 2: Parse CSV ─────────────────────────────────────────────────────────
rows = []
with open(csv_path, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        rp = to_num(row.get('RETURN_PCT'))
        if rp is not None and rp < 10:
            continue  # skip anything below 10%
        image_url = extract_image_url(row.get('IMAGE', ''))
        vendor    = (row.get('VENDOR') or '').strip() or None
        category  = (row.get('CATEGORY') or '').strip() or None
        l1        = (row.get('l1-category') or '').strip() or None

        rows.append({
            "sku_group":        row['SKU_GROUP'].strip(),
            "category":         category,
            "l1_category":      l1,
            "vendor":           vendor,
            "return_pct":       rp,
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

print(f"Parsed {len(rows)} rows (≥10% return rate). Sending to API...")

# ── Step 3: Insert ────────────────────────────────────────────────────────────
payload = json.dumps(rows).encode('utf-8')
req = urllib.request.Request(
    API_BASE,
    data=payload,
    headers={'Content-Type': 'application/json', 'x-api-key': API_KEY},
    method='POST'
)
try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        print(f"SUCCESS: inserted {len(result)} SKUs.")
except urllib.error.HTTPError as e:
    print(f"ERROR {e.code}: {e.read().decode()}")
    sys.exit(1)

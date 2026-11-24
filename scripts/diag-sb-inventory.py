"""Inventario read-only do projeto Supabase (nomes de secrets + funcoes deployadas)."""
import json
import os
import sys
import urllib.error
import urllib.request

RAW = os.environ.get("SB_PAT") or ""
TOKEN = RAW.strip()
print("token_len:", len(RAW), "stripped:", len(TOKEN), "prefix_sbp:", TOKEN.startswith("sbp_"))
REF = os.environ.get("SB_REF", "pgxfvjmuubtbowutlide")


def get(path):
    req = urllib.request.Request(
        f"https://api.supabase.com{path}",
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        return {"__httperror__": e.code, "body": e.read().decode()[:300]}
    except Exception as e:  # noqa: BLE001
        return {"__error__": str(e)}


for label, path in (
    ("ORGS", "/v1/organizations"),
    ("SECRET NAMES", f"/v1/projects/{REF}/secrets"),
    ("FUNCTIONS", f"/v1/projects/{REF}/functions"),
):
    print(f"=== {label} ===")
    data = get(path)
    if isinstance(data, dict):
        print("FALHA:", json.dumps(data, ensure_ascii=False)[:400])
        continue
    if label == "SECRET NAMES":
        print(sorted(x["name"] for x in data))
    elif label == "ORGS":
        print([o["name"] for o in data])
    else:
        print("total:", len(data))
        for f in sorted(data, key=lambda x: (x.get("updated_at") or "")):
            print(" ", f.get("slug"), "|", f.get("version"), "|", f.get("updated_at"), "|", f.get("status"))
sys.stdout.flush()

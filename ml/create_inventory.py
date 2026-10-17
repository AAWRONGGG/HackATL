from pathlib import Path
import pandas as pd

root = Path("ml/data/raw")
rows = []

source_pages = {
    "business_registration": "https://sos.ga.gov/page/georgia-business-forms",
    "food_service_permit": "https://dph.georgia.gov/environmental-health/food-service",
    "tax_document": "https://dor.georgia.gov/",
    "license_supporting_document": "https://www.atlantaga.gov/government/departments/finance/office-of-revenue/before-you-get-started"
}

for file in sorted(root.rglob("*.pdf")):
    category = file.parent.name

    rows.append({
        "file_path": file.as_posix(),
        "filename": file.name,
        "document_type": category,
        "template_group": file.stem,
        "source_url": source_pages.get(category, ""),
        "verified_label": False
    })

df = pd.DataFrame(rows)

output = Path("ml/data/annotations/inventory.csv")
output.parent.mkdir(parents=True, exist_ok=True)
df.to_csv(output, index=False)

print(df.to_string(index=False))
print(f"\nSaved {len(df)} document records to {output}")

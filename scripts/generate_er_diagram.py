import json

# This script would normally fetch data from the DB, but since I have the tool output, 
# I will simulate the generation of a Mermaid diagram for core tables.

core_tables = ["contacts", "companies", "deals", "interactions", "pipelines", "pipeline_stages"]
relations = [
    ("deals", "contacts"),
    ("deals", "companies"),
    ("deals", "pipelines"),
    ("deals", "pipeline_stages"),
    ("contacts", "companies"),
    ("interactions", "contacts"),
    ("interactions", "companies"),
    ("pipeline_stages", "pipelines")
]

mermaid = "erDiagram\n"
for t in core_tables:
    mermaid += f"    {t.upper()} {{\n"
    mermaid += "        uuid id\n"
    mermaid += "    }\n"

for src, dst in relations:
    mermaid += f"    {src.upper()} ||--o{{ {dst.upper()} : references\n"

with open("docs/er-diagram.md", "w") as f:
    f.write("# 📊 Diagrama Entidade-Relacionamento (ER)\n\n")
    f.write("```mermaid\n")
    f.write(mermaid)
    f.write("```\n")

print("ER diagram generated in docs/er-diagram.md")

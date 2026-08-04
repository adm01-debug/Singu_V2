with open('/tmp/fk_info.txt', 'r') as f:
    lines = f.readlines()

mermaid = "erDiagram\n"
added_relations = set()

for line in lines[2:]:
    if '---' in line or '(rows)' in line or not line.strip():
        continue
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 4:
        table, col, f_table, f_col = parts[0], parts[1], parts[2], parts[3]
        # Avoid duplicate relations for Mermaid
        rel = tuple(sorted((table, f_table)))
        if rel not in added_relations:
            mermaid += f"    {table.upper()} ||--o{{ {f_table.upper()} : \"{col}\"\n"
            added_relations.add(rel)

with open('docs/er-diagram.md', 'w') as f:
    f.write("# 📊 Diagrama Entidade-Relacionamento (ER)\n\n")
    f.write("> Gerado automaticamente em 2026-05-13\n\n")
    f.write("```mermaid\n")
    f.write(mermaid)
    f.write("```\n")

print("Detailed ER diagram generated in docs/er-diagram.md")

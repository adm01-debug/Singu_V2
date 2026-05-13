import collections

with open('/tmp/schema_info.txt', 'r') as f:
    lines = f.readlines()

tables = collections.defaultdict(list)

# Simple parser for psql output
for line in lines[2:]: # Skip headers
    if '---' in line or '(rows)' in line or not line.strip():
        continue
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 5:
        table_name, col_name, dtype, nullable, default = parts[0], parts[1], parts[2], parts[3], parts[4]
        tables[table_name].append({
            'name': col_name,
            'type': dtype,
            'nullable': nullable,
            'default': default
        })

with open('docs/data-dictionary.md', 'w') as f:
    f.write('# 📖 Dicionário de Dados — SINGU CRM\n\n')
    f.write('> Gerado automaticamente em 2026-05-13\n\n')
    
    for table_name in sorted(tables.keys()):
        f.write(f'## 📋 Tabela: `{table_name}`\n\n')
        f.write('| Coluna | Tipo | Null | Padrão |\n')
        f.write('| :--- | :--- | :--- | :--- |\n')
        for col in tables[table_name]:
            f.write(f'| `{col["name"]}` | {col["type"]} | {col["nullable"]} | {col["default"]} |\n')
        f.write('\n')

print('Detailed data dictionary generated in docs/data-dictionary.md')

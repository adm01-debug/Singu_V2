tables = [
    {"name": "contacts", "desc": "Pessoas físicas cadastradas no CRM."},
    {"name": "companies", "desc": "Empresas (Pessoas Jurídicas)."},
    {"name": "deals", "desc": "Oportunidades de negócio no pipeline."},
    {"name": "interactions", "desc": "Histórico de contatos (email, whatsapp, call)."},
    {"name": "pipelines", "desc": "Fluxos de venda customizáveis."},
    {"name": "pipeline_stages", "desc": "Estágios de cada pipeline."}
]

with open("docs/data-dictionary.md", "w") as f:
    f.write("# 📖 Dicionário de Dados\n\n")
    f.write("| Tabela | Descrição |\n")
    f.write("| :--- | :--- |\n")
    for t in tables:
        f.write(f"| {t['name']} | {t['desc']} |\n")

print("Data dictionary generated in docs/data-dictionary.md")

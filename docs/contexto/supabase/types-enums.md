# Tipos customizados (enums, domains, composites)

| tipo | kind | valores / definição | usado em |
|---|---|---|---|
| public.activity_outcome | enum | connected, no_answer, scheduled, voicemail, busy, callback, not_interested, qualified | public.sales_activities.outcome |
| public.activity_type | enum | call, email, meeting, linkedin, whatsapp, other | public.sales_activities.activity_type |
| public.app_role | enum | admin, manager, salesperson, moderator, user | _dormant.user_roles.role, public.role_permissions.role, public.user_roles.role |
| public.carrier_homologation_status | enum | pendente, em_analise, homologado, reprovado, suspenso, vencido | public.carrier_homologations.status, public.vw_carrier_homologation_control.ultimo_status, public.vw_carrier_homologation_queue.ultimo_status, public.vw_carriers.homologation_status, public.vw_carriers_completo.homologation_status |
| public.channel_type | enum | whatsapp, email, telefone, sms, reuniao_presencial, reuniao_online, chat_site, redes_sociais, bitrix_chat |  |
| public.company_size | enum | mei, micro, pequena, media, grande, enterprise |  |
| public.company_status | enum | ativo, inativo, suspenso | public.companies.status, public.v_companies_metrics.status, public.vw_carriers_completo.company_status, public.vw_companies_completo.status, public.vw_companies_cores.status, public.vw_companies_stats.status, public.vw_company_social_media.company_status, public.vw_contacts_full.empresa_status, public.vw_customers.status, public.vw_customers_ativos.company_status, public.vw_empresa_historico_completo.status_empresa, public.vw_empresas_hierarquia.status |
| public.company_type | enum | cliente, fornecedor, parceiro, transportadora, grafica, prospect, inativo |  |
| public.contact_role | enum | decisor, comprador, financeiro, operacional, marketing, ti, juridico, recepcao, outros |  |
| public.cor_grupo | enum | branco, preto, cinza, prata, dourado, vermelho, laranja, amarelo, verde, azul, azul_marinho, roxo, rosa, marrom, bege, transparente, multicolor |  |
| public.data_source | enum | CRM, SPA_CLIENTE, SPA_FORNECEDOR, SPA_TRANSPORTADORA, MERGED, MANUAL, LINKEDIN, LUSHA, LEADCONTACT, WHATSAPP | public.contacts.source |
| public.deal_status | enum | aberto, ganho, perdido, cancelado, suspenso | _dormant.deals.status, public.vw_deals_full.status |
| public.email_type | enum | corporativo, pessoal, financeiro, nfe, marketing, comercial, compras | public.company_emails.email_type, public.contact_emails.email_type |
| public.entity_relationship_role | enum | buyer, manager, owner, decision_maker, influencer, user, sponsor, partner, supplier, subsidiary, parent, employee_of, other | public.entity_relationships.role |
| public.entity_type | enum | company, contact | public.entity_relationships.from_type, public.entity_relationships.to_type, public.v_entities.entity_type |
| public.error_severity | enum | info, warning, error, critical | public.error_logs.severity |
| public.evento_tipo | enum | CADASTRO, ATIVACAO, INATIVACAO, REATIVACAO, PRIMEIRA_COMPRA, COMPRA, TRANSFERENCIA, RODIZIO, ATRIBUIDO_SDR, QUALIFICADO_SDR, TENTATIVA_CONTATO |  |
| public.gender | enum | masculino, feminino, outro, nao_informado |  |
| public.interaction_direction | enum | inbound, outbound |  |
| public.interaction_status | enum | pendente, em_andamento, concluido, cancelado, sem_resposta, agendado |  |
| public.lead_status | enum | novo, contatado, qualificando, qualificado, desqualificado, convertido | _dormant.leads.status, public.vw_leads_full.status |
| public.motivo_carteira | enum | NOVO_CLIENTE, RODIZIO_ANUAL, TRANSFERENCIA, REATIVACAO, IMPORTACAO_INICIAL |  |
| public.passo_outcome | enum | respondeu_positivo, respondeu_neutro, nao_respondeu, nao_atendeu, pulou | public.proximo_passo_feedback.outcome |
| public.phone_type | enum | celular_corporativo, fixo_comercial, celular_pessoal, invalido | public.company_phones.phone_type, public.contact_phones.phone_type |
| public.priority_level | enum | baixa, media, alta, urgente | _dormant.deals.prioridade, _dormant.leads.prioridade, _dormant.tasks.prioridade, public.vw_deals_full.prioridade, public.vw_leads_full.prioridade |
| public.salesperson_role | enum | sdr, closer, hybrid | public.salespeople.role |
| public.social_media_platform | enum | linkedin, instagram, facebook, x, youtube, tiktok, whatsapp, google_business, website | public.company_social_media.plataforma, public.contact_social_media.plataforma |
| public.supplier_alert_severity | enum | info, atencao, critico |  |
| public.supplier_homologation_status | enum | pendente, em_analise, homologado, reprovado, suspenso, vencido | public.supplier_homologations.status, public.vw_supplier_homologation_control.ultimo_status, public.vw_supplier_homologation_queue.ultimo_status |
| public.task_priority | enum | high, medium, low | public.sales_tasks.priority |
| public.task_status | enum | pending, in_progress, completed, cancelled | public.sales_tasks.status |
| public.task_type | enum | call, meeting, follow_up, email, proposal, other | public.sales_tasks.type |
| public.validation_kind | enum | email, phone | public.validation_queue.kind |
| public.validation_queue_status | enum | pending, processing, done, error | public.validation_queue.status |
| public.workflow_action_type | enum | send_email, send_whatsapp, create_task, change_stage, change_owner, add_tag, webhook, notify_user, create_activity | _dormant.sla_configs.acao_ao_expirar, _dormant.workflow_actions.action_type |
| public.workflow_trigger_type | enum | lead_created, lead_stage_changed, lead_status_changed, deal_created, deal_stage_changed, deal_status_changed, deal_value_changed, sla_warning, sla_expired, scheduled | _dormant.workflow_triggers.trigger_type |
| public.workspace_account_type | enum | user, group, alias, shared_mailbox, service_account | public.vw_workspace_overview.account_type, public.workspace_accounts.account_type |

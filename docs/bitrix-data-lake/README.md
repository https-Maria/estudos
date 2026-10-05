# Bitrix Data Lake

Projeto prático de engenharia de dados baseado na arquitetura:

```text
Bitrix / API
    ↓
Apache NiFi
    ↓
S3 Bronze
    ↓
Glue / PySpark
    ↓
S3 Silver
    ↓
Glue / PySpark
    ↓
S3 Gold
    ↓
Athena / BI

Step Functions → orquestração
Lake Formation → governança
```

## Objetivo

Construir e entender o pipeline de ponta a ponta, começando pela ingestão real do Bitrix via NiFi.

## Regra de portfólio

**Nunca publicar:**
- tokens/webhooks;
- URLs privadas;
- IDs sensíveis;
- dados de clientes;
- nomes internos confidenciais;
- prints com credenciais;
- payloads reais sem mascaramento.

Use exemplos sintéticos ou anonimizados.

## Template de módulo
```md
# Módulo

## Objetivo
## Arquitetura / fluxo
## O que configurei
## Payload de exemplo (anonimizado)
## Erros encontrados
## Break & Fix
## Evidências
## Decisões técnicas
## Próximo passo
```

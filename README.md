# Teodoro – Quartel-General Digital (baseado em Leon)

Este projeto adiciona o **Teodoro** (orquestrador) e agentes especializados ao [Leon](https://getleon.ai/), formando um “quartel-general digital” modular controlado por **texto** (e opcionalmente **voz** no futuro).

> ⚠️ Pré-requisito: tenha o Leon instalado e rodando na **versão estável** antes de continuar.

---

## 1) Pré-requisitos

- **Node.js ≥ 22.13.1** e **npm ≥ 10.9.2**
- **Git**
- (Opcional) **Python 3** se você for usar skills em Python
- Chave da OpenAI (`OPENAI_API_KEY`) se quiser integrar com ChatGPT

Verifique as versões básicas:

```bash
node -v
npm -v
```

---

## 2) Instalar o Leon (estável)

Instale a CLI e crie um projeto “birth” do Leon:

```bash
npm i -g @leon-ai/cli

leon create birth
cd birth

leon check
leon start
# Abra: http://localhost:1337
# Pare com Ctrl+C para continuar a configuração abaixo
```

---

## 3) Trazer as skills do Teodoro

Em uma pasta paralela à do Leon, clone este repositório (ou baixe o `.zip`):

```bash
cd ..
git clone https://github.com/SEU_USUARIO/teodoro.git
# ou descompacte o .zip
```

Agora copie as skills deste repositório para o Leon, respeitando a estrutura (ajuste o caminho `../teodoro` conforme sua máquina):

```bash
# partindo da pasta do Leon (ex.: birth/)
cd birth

# Crie os domínios se não existirem:
mkdir -p skills/teodoro
mkdir -p skills/business_finance

# Copie as skills do Teodoro para dentro do Leon:
cp -R ../teodoro/skills/teodoro/* skills/teodoro/
cp -R ../teodoro/skills/business_finance/* skills/business_finance/
```

**Regra de ouro:** sem espaços ou acentos em nomes de pastas/arquivos. Use `kebab-case` em inglês (ex.: `control-panel`, `analytics-suite`, `commerce-strategy`, `reporting-hub`).

---

## 4) Configurar variáveis de ambiente (`.env`)

Crie (ou edite) o arquivo `.env` na raiz do projeto Leon (ex.: `birth/.env`):

```bash
# .env
OPENAI_API_KEY=coloque_sua_chave_aqui
LEON_LANGS=pt,en
```

Comece apenas com texto↔texto. Habilite voz (STT/TTS) depois que tudo estiver estável.

---

## 5) Subir o Leon com as novas skills

```bash
leon start
# Abra: http://localhost:1337
```

Teste intenções das suas skills (ex.: abrir painel, criar agente, gerar relatório, sugerir estratégia, etc.).

---

## 6) Estrutura de skills (referência)

As skills vivem em `skills/<domínio>/<skill>`. Cada skill contém:

- `package.json`
- `config.json`
- `intents.json`
- `en.json`, `pt.json`
- `action.js` ou `action.py`

### Teodoro (núcleo/orquestrador)

- `control-panel`: mudar idioma, exibir status do sistema e abrir o painel.
- `skill-registry`: adicionar/atualizar/remover skills (inclusive via repositório GitHub).
- `agent-factory`: criar e registrar novos agentes com manifesto.
- `comms-monitor`: monitorar logs e assinaturas de canais.

### Agente Financeiro (módulo independente)

- `analytics-suite` (Node.js): análises estatísticas e leitura de dados externos.
- `commerce-strategy` (Python): funis de venda, UX/copywriting e psicologia do consumidor.
- `reporting-hub` (Node.js): relatórios PDF/CSV, projeções e simulações financeiras.

Os agentes conversam entre si e com o Teodoro, que coordena as execuções.

---

## 7) Integrações (opcionais)

- **ChatGPT / OpenAI**: utilize `OPENAI_API_KEY` no `.env`.
- **n8n / E-commerce / ERPs / CRMs**: exponha webhooks/APIs pelas skills.
- Depois que o fluxo texto↔texto estiver estável, você pode habilitar entrada/saída de voz configurando `STT_PROVIDER` e `TTS_PROVIDER`.

---

## 8) Solução de problemas rápida

- **Não abre http://localhost:1337** → Confirme `leon start` sem erros, porta livre e uso da versão estável do Leon.
- **“Cannot find module …”** → Verifique se copiou as pastas para `skills/<domínio>/<skill>` sem acentos/espaços. Reinicie `leon start`.
- **“API key missing”** → Confirme o `.env` na raiz do projeto. Reinicie.
- **Skills em Python falhando** → Confira `python --version` e dependências específicas da skill.

---

## 9) Próximos passos

- Implementar (posteriormente) a interface web opcional para o `control-panel`.
- Criar mais agentes (Marketing, Operações, Jurídico, etc.).
- Adicionar testes automatizados e pipeline de CI.

---

## Árvore de pastas deste repositório

```text
skills/
  teodoro/
    control-panel/
      package.json
      config.json
      intents.json
      en.json
      pt.json
      action.js
    skill-registry/
      package.json
      config.json
      intents.json
      en.json
      pt.json
      action.js
    agent-factory/
      package.json
      config.json
      intents.json
      en.json
      pt.json
      action.js
    comms-monitor/
      package.json
      config.json
      intents.json
      en.json
      pt.json
      action.js

  business_finance/
    analytics-suite/
      package.json
      config.json
      intents.json
      en.json
      pt.json
      action.js
    commerce-strategy/
      package.json
      config.json
      intents.json
      en.json
      pt.json
      action.py
    reporting-hub/
      package.json
      config.json
      intents.json
      en.json
      pt.json
      action.js
```

Padrões de nome: apenas letras minúsculas (`a-z`), números (`0-9`) e hífen (`-`).

---

## `.env.example`

Um arquivo de exemplo com as variáveis principais está disponível em [`./.env.example`](./.env.example). Copie-o para a raiz do seu projeto Leon e renomeie para `.env` antes de preencher sua chave.

# Teodoro – Quartel-General Digital com Leon

Este repositório contém a configuração base do seu assistente pessoal **Teodoro**, construído sobre o ecossistema [Leon](https://getleon.ai/) e preparado para operar como um "quartel-general digital" modular. O projeto foi organizado para atender aos seguintes princípios:

- **Núcleo central (Teodoro)** capaz de orquestrar agentes especialistas.
- **Agentes independentes** e expansíveis, com _skills_ em Node.js ou Python.
- **Arquitetura escalável** e compatível com integrações externas (APIs, n8n, ChatGPT, etc.).
- **Interface preparada para controle visual** (Web UI opcional) e fluxo de trabalho por voz e texto.

> ⚠️ **Pré-requisito**: É necessário ter o projeto principal do Leon já instalado (via Docker ou CLI oficial). Este repositório fornece os pacotes personalizados do Teodoro e instruções para integrá-los ao Leon.

---

## Estrutura do Projeto

```
.
├── README.md
├── docker-compose.teodoro.yml
└── packages
    ├── financeiro
    │   ├── package.json
    │   ├── config.json
    │   └── src
    │       ├── analytics-suite
    │       │   ├── config.json
    │       │   ├── en.json
    │       │   ├── pt.json
    │       │   ├── intents.json
    │       │   └── action.js
    │       ├── commerce-strategy
    │       │   ├── config.json
    │       │   ├── en.json
    │       │   ├── pt.json
    │       │   ├── intents.json
    │       │   └── action.py
    │       └── reporting-hub
    │           ├── config.json
    │           ├── en.json
    │           ├── pt.json
    │           ├── intents.json
    │           └── action.js
    └── teodoro
        ├── package.json
        ├── config.json
        └── src
            ├── control-panel
            │   ├── config.json
            │   ├── en.json
            │   ├── pt.json
            │   ├── intents.json
            │   └── action.js
            ├── skill-registry
            │   ├── config.json
            │   ├── en.json
            │   ├── pt.json
            │   ├── intents.json
            │   └── action.js
            ├── agent-factory
            │   ├── config.json
            │   ├── en.json
            │   ├── pt.json
            │   ├── intents.json
            │   └── action.js
            └── comms-monitor
                ├── config.json
                ├── en.json
                ├── pt.json
                ├── intents.json
                └── action.js
```

- Cada **package** representa um agrupamento lógico de skills do Leon.
- As **skills** possuem intenções (`intents.json`), respostas multilíngues (`pt.json`, `en.json`) e ações em Node.js ou Python (`action.js` ou `action.py`).
- O `docker-compose.teodoro.yml` permite subir uma instância personalizada do Leon com os pacotes do Teodoro conectados.

---

## Passo a Passo de Instalação

### 1. Preparar o Leon oficial

```bash
# Clonar o Leon (caso ainda não tenha)
git clone https://github.com/leon-ai/leon.git
```

> Se preferir, deixe este terminal aberto dentro da pasta `leon` — iremos reutilizá-lo mais adiante.

### 2. Clonar o Teodoro

Em outro terminal (ou após sair da pasta `leon`), obtenha este repositório e entre nele:

```bash
git clone https://github.com/<seu-usuario>/teodoro.git
cd teodoro
```

### 3. Instalar o Teodoro automaticamente

Com o terminal posicionado na raiz **deste** projeto (`teodoro`), execute o script passando o caminho do seu checkout do Leon:

```bash
./scripts/install-teodoro.sh /caminho/para/seu/leon

# Exemplo comum, se os diretórios estão lado a lado:
./scripts/install-teodoro.sh ../leon

# Se você continuou dentro da pasta "leon", execute a partir dela apontando para o script externo:
../teodoro/scripts/install-teodoro.sh .
```

O script copiará os pacotes `teodoro` e `financeiro` para `packages/teodoro-system` dentro do Leon, registrará as entradas em `core/config/instances.json` e atualizará o arquivo `docker-compose.teodoro.yml` do Leon. Ele é idempotente: pode ser executado novamente ao atualizar este repositório.

> Requisitos do script: `bash`, `python3` e permissões de escrita no diretório do Leon.

### 4. Instalar dependências do Leon

De volta ao diretório do Leon:

```bash
npm install
npm run bootstrap
```

### 5. Executar com Docker (recomendado)

Ainda no diretório do Leon:

```bash
# Suba os serviços com o compose preparado pelo script
docker compose -f docker-compose.teodoro.yml up -d
```

> ✅ **Verifique as montagens**: dentro do diretório do Leon, execute `ls packages/teodoro-system/packages` para confirmar que `financeiro/` e `teodoro/` foram copiados. O `docker-compose.teodoro.yml` monta esses diretórios diretamente no container (`/home/leon/packages/...`), garantindo que o Leon carregue as skills.

O serviço principal estará acessível na porta `4242`. Para habilitar a interface visual opcional, execute o compose com o perfil `dashboard`:

```bash
docker compose -f docker-compose.teodoro.yml --profile dashboard up -d
```

### 6. Compilar as skills manualmente (opcional)

Leon irá detectar os pacotes automaticamente na primeira execução. Caso queira forçar a compilação das _skills_:

```bash
npm run build -- --scope @teodoro/* --scope @teodoro-financeiro/*
```

---

## Teodoro – Núcleo do Sistema

Teodoro é o maestro responsável por coordenar a operação. Ele oferece:

- **Interface de controle**: A skill `control-panel` expõe comandos para mudar idioma, consultar status do sistema e abrir a interface web (veja abaixo).
- **Gerência de skills**: A skill `skill-registry` facilita adicionar, atualizar ou remover habilidades. Ela consome repositórios Git (via `simple-git`) e registra as entradas no Leon automaticamente.
- **Criação de agentes**: A skill `agent-factory` gera manifestos para novos agentes, define responsabilidades e automatiza a criação da estrutura de pastas.
- **Monitoramento**: A skill `comms-monitor` acessa os logs centralizados (via WebSocket) e fornece feedback ao usuário em tempo real.

### Interface Visual

A interface opcional utiliza Next.js e pode ser habilitada via variável `TEODORO_CONTROL_CENTER=1`. Ela consome a API exposta pelo `control-panel` e oferece:

- Dashboard com status dos agentes.
- Formulário para criar habilidades/skills e agentes.
- Visualização de logs ao vivo.

> O código da interface pode ser hospedado no diretório `packages/teodoro-system/apps/control-center` após a instalação (o script copia o conteúdo de `apps/control-center` para lá) ou conectado externamente.

---

## Agentes Especialistas

Agentes vivem em pacotes separados. O exemplo inicial é o **Agente Financeiro**, com foco em vendas, UX, finanças, psicologia do consumidor e análise de dados.

### Principais skills do Agente Financeiro

| Skill | Função | Linguagens |
|-------|--------|------------|
| `analytics-suite` | Interpreta métricas de desempenho e cria relatórios estatísticos. | Node.js |
| `commerce-strategy` | Sugere funis de vendas, otimizações de UX e copywriting. | Python |
| `reporting-hub` | Gera relatórios financeiros completos (PDF/CSV) e simulações. | Node.js |

Cada skill é modular, podendo receber atualizações contínuas e integrar APIs externas (CRM, ERPs, e-commerces, etc.).

### Comunicação entre Agentes

- **Bus de Eventos**: Teodoro expõe um barramento (WebSocket + Redis Pub/Sub) compartilhado com os agentes.
- **Mensagens Diretas**: As skills podem enviar mensagens para outras usando o endpoint `/agents/{name}/notify`.
- **Colaboração**: Por exemplo, `commerce-strategy` pode solicitar ao `analytics-suite` dados de performance antes de sugerir ações.

---

## Suporte a Voz e Texto

- **Entrada por Voz**: Configurada via `Snowboy`/`Porcupine` para wake-word e `Vosk` para reconhecimento em português/inglês.
- **Saída em Voz**: Skills podem responder com áudio gerado por `Coqui TTS` ou `Google Cloud TTS` (configurável).
- **Fallback por Texto**: Todo fluxo pode ser operado via chat (CLI, web ou API), garantindo acessibilidade.

Variáveis relevantes (em `.env` do Leon):

```
# Idiomas suportados
TEODORO_LANGUAGES=pt,en

# Configuração de STT/TTS
STT_PROVIDER=vosk
STT_VOSK_MODEL=pt
TTS_PROVIDER=coqui
TTS_COQUI_VOICE=ed
```

---

## Integrações Externas

- **n8n**: Disponibilize _webhooks_ para orquestrar automações.
- **APIs de E-commerce**: Use `commerce-strategy` para consumir dados (Shopify, VTEX, WooCommerce, etc.).
- **ChatGPT / OpenAI**: Integre através das credenciais setadas em variáveis `OPENAI_API_KEY`.

Cada skill possui uma seção `integrations` em seu `config.json` para habilitar as conexões sem alterar o código base.

---

## Expansão

1. **Criar novo agente**: Execute `Hey Leon, create agent called Pesquisa with focus on market research`. Teodoro irá gerar a estrutura automaticamente.
2. **Adicionar skill**: Informe o repositório Git ou faça upload via interface. A skill será adicionada ao manifesto do agente e compilada.
3. **Atualizar idioma**: Use o comando `Switch Teodoro to English` ou `Alterar Teodoro para português`.
4. **Logs**: Consulte `Show me the latest agent logs` para obter os registros.

---

## Próximos Passos

- Implementar a interface web (Next.js) conectada ao `control-panel`.
- Adicionar testes automatizados para as skills.
- Expandir o catálogo de agentes (Marketing, Jurídico, Operações, etc.).
- Criar _pipelines_ de CI/CD (GitHub Actions) para validar novas skills antes de publicá-las.

---

## Licença

MIT.

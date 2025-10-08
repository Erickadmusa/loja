# Projeto Loja

Este repositório foi disponibilizado sem o código-fonte do front-end e do back-end. Durante a análise automática realizada neste ambiente foi possível apenas verificar o estado do repositório Git e testar rapidamente o endpoint informado (`http://129.212.191.6:1337/`).

## Observações

- A chamada HTTP para o endpoint informado retorna **403 Forbidden**, indicando que o serviço remoto está bloqueando o acesso a partir deste ambiente ou requer autenticação adicional.
- Sem o código-fonte local do front-end (http://localhost:3000) ou do back-end, não é possível diagnosticar ou corrigir os problemas de integração diretamente neste repositório.

## Como disponibilizar o código-fonte aqui

Para que possamos investigar e corrigir os problemas entre o front-end e o back-end, é necessário que os arquivos do projeto estejam presentes neste repositório. Algumas formas de trazer o código para cá:

1. **Exportar o projeto existente**
   - Localize a pasta do front-end e/ou do back-end na máquina onde eles estão instalados.
   - Compacte a pasta (por exemplo, `zip -r frontend.zip caminho/do/frontend`).
   - Transfira o arquivo compactado para sua máquina local e, em seguida, adicione-o a este repositório, descompactando os arquivos dentro da estrutura adequada (`frontend/`, `backend/`, etc.).

2. **Clonar de um repositório Git externo**
   - Caso o código esteja hospedado em outro repositório Git (GitHub, GitLab, Bitbucket), utilize `git clone` para baixar o projeto e mova os arquivos relevantes para este repositório.
   - Lembre-se de incluir todos os arquivos de configuração (`.env.example`, `package.json`, `strapi.config.js`, etc.) necessários para reproduzir o ambiente.

3. **Gerar um export do Strapi**
   - Se o backend for Strapi, utilize `strapi export` (Strapi v4) ou outra ferramenta de backup para gerar um pacote com a configuração, schemas e dados relevantes.
   - Adicione o conteúdo exportado ao repositório para que possamos restaurar e inspecionar o backend localmente.

Após adicionar os arquivos, faça um commit e envie (`git push`) para que a análise automatizada possa reconstruir o ambiente e iniciar os testes.

## Próximos Passos Recomendados

1. Verifique se o backend Strapi (porta 1337) está aceitando conexões da origem onde o front-end está hospedado. Ajustes de CORS, autenticação ou whitelists de IP podem ser necessários.
2. Garanta que o front-end consome as variáveis de ambiente corretas para apontar para o backend (`NEXT_PUBLIC_API_URL`, `VITE_API_URL`, etc.).
3. Após disponibilizar o código-fonte neste repositório, será possível executar testes locais e aplicar correções específicas.

## Diagnóstico Automático

O script `scripts/test-backend-connection.sh` pode ser usado para reproduzir o teste rápido do endpoint.

```bash
./scripts/test-backend-connection.sh
```

Ele realiza uma requisição `curl -I` e exibe os headers da resposta, permitindo conferir o status HTTP retornado pelo serviço remoto.

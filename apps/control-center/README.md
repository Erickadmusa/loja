# Control Center (Opcional)

Este diretório pode hospedar a interface visual (ex.: Next.js) do painel de controle do Teodoro.

- Porta padrão: `4242` (mapeada para `localhost:3000` quando o profile `dashboard` do Docker Compose está ativo).
- Consome a API do Leon exposta pela skill `control-panel`.
- Pode ser implementado com gráficos em tempo real (WebSockets) para exibir logs e status dos agentes.

> A implementação da interface não faz parte deste commit; utilize este diretório como ponto de partida para o front-end.

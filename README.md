# Assistente de vendas IPTV

Aplicacao web responsiva para atendimento guiado de clientes de IPTV. O cliente informa ou confirma o WhatsApp, escolhe o dispositivo, segue as perguntas do fluxo e chega a uma tela provisoria pronta para futura criacao de teste.

## Tecnologias

- React
- TypeScript
- Vite
- CSS responsivo
- LocalStorage

## Como executar

```bash
npm install
npm run dev
npm run build
npm run start
```

Durante o desenvolvimento, o Vite mostra a URL local no terminal.

Use `npm run dev` para desenvolvimento. Depois do build, use `npm run start` para servir a aplicacao com o proxy `/api/create-trial`. O comando `vite preview` nao deve ser usado para testar criacao de teste, porque ele nao inclui o proxy do The Best.

## Telefone por URL

A aplicacao aceita os parametros `telefone`, `phone` e `numero`.

Exemplo:

```text
http://localhost:5173/?telefone=5551999999999
```

O numero e limpo, validado e salvo internamente apenas com digitos, preferencialmente com o codigo do pais `55`.

## Onde alterar configuracoes

Edite `src/config/appConfig.ts` para alterar:

- Numero do suporte: `supportWhatsapp`
- Nome da empresa: `companyName`
- Logos da marca: `logoIcon` e `logoWide`
- Cores base: `theme`
- Codigos dos aplicativos: `installCodes`
- Textos padrao da integracao The Best: `bestPanel.notes`

Os logos da NIXPLAY ficam em:

```text
public/assets/brand
```

A paleta visual principal fica em `src/index.css`, nas variaveis `--primary`, `--accent` e `--brand-gradient`.

## Como configurar a criacao de teste no The Best

Opcao recomendada para operar pelo navegador:

1. Acesse `/admin`
2. Digite a senha `123`
3. Configure endpoint, token Bearer, package e observacao
4. Clique em `Salvar configuracao`

Essa configuracao fica salva no LocalStorage do navegador.

Como padrao inicial do projeto, tambem e possivel criar um arquivo `.env.local` na raiz, usando `.env.example` como base:

```bash
VITE_BEST_PANEL_TEST_ENDPOINT=https://painel.best/lines/create-trial/
VITE_BEST_PANEL_LOGIN=revendaluiz
VITE_BEST_PANEL_API_TOKEN=sua_api_aqui
VITE_BEST_PANEL_PACKAGE_ID=id_do_pacote_aqui
```

Depois reinicie o servidor:

```bash
npm run dev
```

O payload enviado para o painel fica em `src/services/customerFlowService.ts`:

```json
{
  "type": null,
  "email": null,
  "notes": "Vendas pelo APP",
  "phone": "{telefone}",
  "password": "",
  "username": "{telefone}",
  "plan_value": null,
  "package_id": "{package}"
}
```

Atencao: variaveis `VITE_` ficam visiveis no navegador. Para uso em producao, o ideal e criar um backend/proxy para guardar a API com seguranca.

A senha temporaria do admin fica em `src/config/appConfig.ts`, em `adminPassword`.

Edite `src/config/appAssets.ts` para alterar quais logos, prints e videos aparecem para cada aplicativo.

Os arquivos visuais ficam em:

```text
public/assets/apps
```

## Onde alterar textos e fluxo

Edite `src/data/flowSteps.ts` para alterar perguntas, respostas, textos exibidos e proximas etapas do atendimento.

## Camada preparada para API

As funcoes de atendimento estao em `src/services/customerFlowService.ts`:

- `saveFlowProgress(data)`
- `finishFlow(data)`
- `createTrial(data)`

`createTrial(data)` faz POST para o endpoint configurado do The Best.

## Persistencia

O progresso do atendimento e salvo em LocalStorage. O botao `Recomeçar atendimento` limpa o progresso salvo e reinicia o fluxo.

# Lista de Presentes — Laura & Davi — Design

**Data:** 2026-09-19
**Status:** aprovado em conversa, aguardando revisão da spec

## Objetivo

Site estático com a lista de presentes do casamento de Laura e Davi (10.07.2027, Mombaça Park). O convite principal continua no Canva (https://lauraedavi.my.canva.site/dahp8i6lckw); o botão "Lista de presentes" de lá aponta para este site.

O convidado vê a lista, escolhe um presente e paga por PIX (QR code ou "copia e cola") ou, como alternativa, por um link de pagamento externo.

## Restrições

- **Sem backend, sem banco, sem build.** Só HTML, CSS, JavaScript puro (ES modules) e um arquivo JSON.
- **Hospedagem:** GitHub Pages (grátis, HTTPS). Publicar = commit no repositório.
- **Edição da lista:** a Laura edita `presentes.json` (pelo site do GitHub) e envia fotos para `img/`. Ela não precisa mexer em código.
- **PIX:** a Laura gera no app do banco **um PIX estático com valor fixo por presente** e cola o "copia e cola" no JSON. O site não gera nem altera códigos PIX, só desenha o QR a partir do código.
- **Visual:** segue o `style-guide.md` (cores, fontes, identidade de convite com flores em aquarela).

## Fora do escopo

Categorias, ordenação, marcar presente como "já dado", controle de quem presenteou, recados, link direto para um presente, painel administrativo. O casal confere os presentes pelo extrato do banco.

## Estrutura de arquivos

```
site-laura/
├── index.html
├── presentes.json          ← dados da lista (a Laura edita)
├── img/                    ← fotos dos presentes + ornamentos otimizados
├── css/style.css
├── js/
│   ├── app.js              ← carrega o JSON, valida e monta a grade
│   ├── modal.js            ← abre/fecha o modal, desenha o QR, botão copiar
│   ├── presentes.js        ← funções puras: validarPresente, formatarPreco
│   └── vendor/qrcode.min.js← biblioteca de QR code copiada para o projeto
├── tests/presentes.test.js ← testes das funções puras (node --test)
├── README.md               ← manual para a Laura (ver seção própria)
├── style-guide.md
└── assets-canva/           ← imagens originais do Canva (referência, não servidas)
```

## Formato dos dados — `presentes.json`

```json
{
  "presentes": [
    {
      "id": "jogo-de-panelas",
      "title": "Jogo de panelas",
      "description": "Frase opcional",
      "url_img": "img/panelas.jpg",
      "price_in_cents": 45000,
      "pix_code": "00020126...6304ABCD",
      "link_payment": "https://..."
    }
  ]
}
```

| Campo | Obrigatório | Tipo | Regra |
|---|---|---|---|
| `id` | sim | texto | Único na lista; letras minúsculas, números e hífen |
| `title` | sim | texto | Não vazio |
| `description` | não | texto | Aparece só no modal |
| `url_img` | sim | texto | Caminho local (`img/...`) ou URL `https://` |
| `price_in_cents` | sim | número inteiro | Maior que zero. `45000` = R$ 450,00 |
| `pix_code` | sim | texto | Começa com `000201` (formato BR Code) |
| `link_payment` | não | texto | URL `https://`; se ausente ou vazio, o botão de cartão não aparece |

Os itens aparecem na ordem do arquivo.

## Módulos

### `js/presentes.js` (puro, sem DOM)
- `formatarPreco(centavos) → string` — `45000` → `"R$ 450,00"`, via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- `validarPresente(item) → { ok: boolean, erros: string[] }` — aplica as regras da tabela acima.
- `prepararLista(dados) → { presentes: Presente[], avisos: string[] }` — recebe o JSON já parseado, descarta itens inválidos e com `id` duplicado (mantém o primeiro) e devolve os avisos em texto legível (ex.: `Presente #3 ("Liquidificador"): falta pix_code`).

### `js/app.js`
- Faz `fetch('presentes.json')`, chama `prepararLista`, escreve cada aviso com `console.warn` e renderiza a grade.
- Cada card é um `<button>` (acessível por teclado) com foto, título e preço; o clique chama `abrirModal(presente)`.

### `js/modal.js`
- `abrirModal(presente)` — preenche e abre um `<dialog>` com `showModal()`.
- Fecha com o botão "×", com Esc (nativo) e com clique no backdrop.
- Desenha o QR code do `pix_code` com a biblioteca em `vendor/`.
- Botão **Copiar** usa `navigator.clipboard.writeText`; quando dá certo, mostra "Copiado ✓" por 2 s. Se falhar, seleciona o texto do código para cópia manual.

## Interface

### Página
- **Topo:** ornamento da moldura floral; "Laura & Davi" em fonte script; "Lista de presentes" em serifada; uma frase curta de agradecimento; link "← voltar ao convite" para o Canva.
- **Grade:** cards brancos (`--color-paper`) sobre fundo `--color-bg`, foto quadrada (`object-fit: cover`), título em `--color-text` e preço em dourado (`--color-accent`). Colunas: 4 em telas ≥ 1024px, 3 em ≥ 720px, 2 abaixo disso.
- **Rodapé:** "Laura & Davi · 10.07.2027".

### Modal
- Retangular, centralizado, `::backdrop` escurecido com `backdrop-filter: blur(...)`.
- **Coluna esquerda:** foto, título, preço e descrição (se houver).
- **Coluna direita:** QR code do PIX; campo somente leitura com o código "copia e cola" e o botão **Copiar**; dica "Coloque seu nome na mensagem do PIX 💛"; linha divisória; botão **Pagar com cartão**, que abre `link_payment` em nova aba (`target="_blank" rel="noopener"`) e só aparece se o link existir.
- **Abaixo de 720px:** as colunas empilham (produto em cima, PIX embaixo); o modal ocupa quase a tela inteira e tem rolagem interna.

### Estilo
- Tokens de cor do `style-guide.md` como variáveis CSS.
- Fontes: Cormorant Garamond (texto) e Pinyon Script (nomes), via Google Fonts, com fallbacks `Georgia, serif` e `cursive`.
- Ornamentos: versões otimizadas (WebP/PNG com menos de 200 KB) das imagens de `assets-canva/`, salvas em `img/`.

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| `presentes.json` não carrega ou tem JSON inválido | Mensagem na página: "Não foi possível carregar a lista. Tente recarregar a página." |
| Item com campo obrigatório faltando ou inválido | Item não aparece; aviso no console explica qual e por quê |
| `id` duplicado | Aparece só o primeiro; aviso no console |
| Lista vazia após validação | Mensagem: "Em breve, novidades por aqui 💛" |
| Imagem não carrega | O card mostra um fundo liso `--color-envelope` no lugar da foto |
| Clipboard indisponível | O texto do código fica selecionado para cópia manual |
| Biblioteca de QR falha | O QR não aparece, mas o código e o botão Copiar continuam funcionando |

## Testes

- **Unitários** (`node --test tests/`, sem dependências): `formatarPreco` (valores inteiros, centavos, milhares) e `validarPresente` / `prepararLista` (item válido, cada campo obrigatório faltando, preço como texto, preço zero, `pix_code` inválido, `id` duplicado, `link_payment` opcional).
- **Manual no navegador** (`python3 -m http.server`): grade em larguras de computador e celular (~390px), abrir e fechar o modal (×, Esc, clique fora), copiar o código, QR legível por um app de banco, link de cartão abrindo em nova aba, JSON quebrado, imagem inexistente.

## README.md (manual para a Laura)

Escrito em português simples, para quem não programa. Conteúdo:

1. **Como o site funciona:** site estático no GitHub Pages; a lista vem do `presentes.json`; o convidado paga direto na conta de vocês; o site não registra quem deu o quê (confira pelo extrato).
2. **Como gerar o PIX de um presente:** PIX estático com valor fixo no app do banco, **nunca uma cobrança com vencimento**; copiar o "copia e cola"; testar lendo o QR com outro celular.
3. **Adicionar um presente:** enviar a foto para `img/` pelo GitHub (Add file → Upload files); editar `presentes.json` (lápis ✏️); copiar um bloco existente, colar e trocar os valores; salvar (Commit changes); esperar cerca de 1 minuto e conferir o site.
4. **Editar um presente:** trocar o valor no bloco; se mudar o preço, **gerar um PIX novo** com o valor novo.
5. **Remover um presente:** apagar o bloco inteiro, do `{` ao `}`, e a vírgula que sobrar.
6. **Regras do JSON e erros comuns:** vírgula entre blocos e nunca depois do último; aspas retas; preço em centavos, sem aspas (`45000`); `id` sem espaços nem acentos. Como validar colando o arquivo em https://jsonlint.com.
7. **Se algo der errado:** página com "Não foi possível carregar a lista" = JSON quebrado; presente sumiu = campo faltando (ver o console do navegador, F12); como desfazer uma alteração pelo histórico do GitHub.
8. **Testar no computador** (opcional): `python3 -m http.server` e abrir http://localhost:8000.
9. **Publicação (configuração única):** ativar GitHub Pages em Settings → Pages; atualizar o link no Canva.

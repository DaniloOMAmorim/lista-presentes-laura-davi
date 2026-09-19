# Lista de presentes · Laura & Davi 💛

Este é o site da lista de presentes do casamento. Aqui você aprende a **adicionar, editar e remover presentes** sem precisar programar.

> ⚠️ **Antes de divulgar o site:** a lista começa com 3 presentes de **exemplo** (os que têm "Exemplo:" no nome). Os PIX deles não funcionam de propósito. Apague esses três e coloque os presentes de verdade.

---

## 1. Como o site funciona

- O site fica hospedado de graça no **GitHub Pages**.
- A lista de presentes fica toda num único arquivo: **`presentes.json`**. É o único arquivo que você precisa editar (além de enviar as fotos para a pasta **`img`**).
- Quando o convidado clica num presente, abre uma janela com:
  - a foto, o nome e o preço;
  - o **QR code do PIX** e o código **"copia e cola"**, com um botão para copiar;
  - um botão **"Pagar com cartão"**, só se você colocar um link de pagamento nesse presente.
- O dinheiro vai **direto para a conta de vocês**. O site não guarda nada.
- ❗ O site **não sabe quem deu o quê** nem marca um presente como "já dado". Confiram pelo extrato do banco. A página pede para o convidado **colocar o nome na mensagem do PIX**.

---

## 2. Como gerar o PIX de um presente

Cada presente tem o próprio código PIX, com o **valor já definido**.

1. No app do banco, procure **"Receber com PIX"**, **"Cobrar"** ou **"Gerar QR code"**.
2. Escolha a opção **com valor definido** e digite o preço do presente (ex.: R$ 450,00).
3. ⚠️ Use o **QR code estático** (o simples). **Não use "cobrança com vencimento" nem "QR code dinâmico"**: esses **expiram** e param de funcionar antes do casamento.
4. Copie o código **"PIX copia e cola"**. É um texto grande que começa com `000201`.
5. **Teste:** abra o QR code no site e leia com outro celular (sem pagar). Deve aparecer o nome de vocês e o valor certo.

---

## 3. Adicionar um presente

Tudo pelo navegador, no site do GitHub, sem instalar nada.

### Passo 1 — Enviar a foto

1. No repositório do GitHub, entre na pasta **`img`**.
2. Clique em **Add file → Upload files** e arraste a foto.
3. Use um nome **sem espaços e sem acentos**, por exemplo `jogo-de-panelas.jpg`.
4. Clique em **Commit changes**.

💡 Dicas: fotos **quadradas** ficam melhores. Deixe cada foto com **menos de 300 KB**; dá para diminuir em sites como [squoosh.app](https://squoosh.app).

### Passo 2 — Colocar o presente na lista

1. Abra o arquivo **`presentes.json`** e clique no **lápis ✏️** (Edit this file).
2. Cada presente é um **bloco** entre `{` e `}`. Copie um bloco inteiro e cole logo abaixo do último.
3. Troque os valores do bloco novo:

```json
    {
      "id": "jogo-de-panelas",
      "title": "Jogo de panelas",
      "description": "Para a gente cozinhar juntos",
      "url_img": "img/jogo-de-panelas.jpg",
      "price_in_cents": 45000,
      "pix_code": "00020126...cole aqui o PIX copia e cola...6304ABCD",
      "link_payment": "https://link-do-mercado-pago..."
    }
```

| Campo | O que é | Obrigatório? |
|---|---|---|
| `id` | Um apelido único para o presente. Só **letras minúsculas sem acento, números e hífen**. Ex.: `jogo-de-panelas` | ✅ Sim |
| `title` | O nome que aparece no site | ✅ Sim |
| `description` | Uma frase que aparece quando o presente é aberto | Não |
| `url_img` | A foto: `img/` + o nome do arquivo que você enviou (ou um link começando com `https://`) | ✅ Sim |
| `price_in_cents` | O preço **em centavos**, **sem aspas, pontos ou vírgulas** (tabela abaixo) | ✅ Sim |
| `pix_code` | O código "PIX copia e cola" gerado no banco | ✅ Sim |
| `link_payment` | Link de pagamento com cartão (Mercado Pago, PagSeguro etc.). Se não tiver, apague a linha | Não |

**Como escrever o preço em centavos:** é o valor sem a vírgula.

| Preço | `price_in_cents` |
|---|---|
| R$ 50,00 | `5000` |
| R$ 189,90 | `18990` |
| R$ 450,00 | `45000` |
| R$ 1.200,00 | `120000` |

4. Role até o fim e clique em **Commit changes**.
5. Espere cerca de **1 minuto** e recarregue o site. O presente novo aparece no fim da lista. A ordem dos presentes no site é a mesma do arquivo.

---

## 4. Editar um presente

1. Abra o `presentes.json` → **lápis ✏️**.
2. Encontre o bloco do presente e troque o que quiser (entre as aspas).
3. **Commit changes**.

⚠️ **Mudou o preço? Gere um PIX novo no banco** com o valor novo e troque também o `pix_code`. O PIX antigo continua cobrando o valor antigo.

---

## 5. Remover um presente

1. Abra o `presentes.json` → **lápis ✏️**.
2. Apague o bloco inteiro do presente, do `{` até o `}`.
3. Confira as vírgulas (seção 6): se apagou o **último** bloco, apague também a vírgula que ficou no fim do bloco anterior.
4. **Commit changes**.

Se quiser, apague a foto dele da pasta `img` (abra a foto → ícone de lixeira 🗑️).

---

## 6. Regras do arquivo (e os erros mais comuns)

O `presentes.json` é um arquivo bem "chato" com a pontuação. Um único erro faz a página mostrar **"Não foi possível carregar a lista"**. As regras:

**✅ Vírgula entre os blocos, mas nunca depois do último:**

```json
{
  "presentes": [
    { ...presente 1... },
    { ...presente 2... },
    { ...presente 3... }
  ]
}
```

❌ Errado: `{ ...presente 3... },` ← vírgula sobrando antes do `]`

**✅ Vírgula no fim de cada linha, menos na última linha do bloco:**

```json
    {
      "id": "jantar",
      "title": "Jantar a dois",
      "url_img": "img/jantar.jpg",
      "price_in_cents": 18990,
      "pix_code": "000201..."
    }
```

**Outras regras:**

- Textos sempre entre **aspas retas** `"assim"`. Se você copiar de um app de notas ou do Word, as aspas podem virar `“curvas”`, e isso quebra o arquivo.
- O preço vai **sem aspas**: `45000` ✅ e `"45000"` ❌.
- Nada de aspas **dentro** de um texto. Use `'aspas simples'` se precisar.
- O `id` não pode repetir, e não pode ter espaço nem acento.

**💡 Como conferir antes de salvar:** copie o arquivo inteiro, cole em [jsonlint.com](https://jsonlint.com) e clique em **Validate JSON**. Se aparecer "Valid JSON", pode salvar. Se não, ele mostra a linha com erro.

---

## 7. Se algo der errado

| O que aparece | O que significa | Como resolver |
|---|---|---|
| **"Não foi possível carregar a lista. Tente recarregar a página."** | Tem um erro de pontuação no `presentes.json` | Cole o arquivo no [jsonlint.com](https://jsonlint.com) para achar a linha, ou desfaça a última alteração (abaixo) |
| **Um presente sumiu** | Faltou um campo obrigatório, ou algum está escrito errado | Veja o motivo no console (abaixo) |
| **"Em breve, novidades por aqui 💛"** | A lista está vazia | Adicione presentes |
| **Presente sem foto (só um fundo bege)** | O nome em `url_img` não bate com o arquivo em `img` | Confira letra por letra, inclusive `.jpg`/`.png` e maiúsculas |
| **O QR code não abre no banco** | O `pix_code` foi copiado pela metade | Copie o "copia e cola" de novo no banco |

**Como ver o motivo de um presente sumido (no computador):** abra o site, aperte **F12** e clique na aba **Console**. Aparece uma mensagem em amarelo explicando, por exemplo:

```
[presentes.json] Presente #3 ("Liquidificador"): falta pix_code
```

"#3" quer dizer o 3º bloco do arquivo.

**Como desfazer uma alteração:** no GitHub, abra o `presentes.json` e clique em **History**. Lá aparecem todas as versões salvas: abra uma versão antiga, copie o conteúdo e cole de volta no arquivo (lápis ✏️ → colar → Commit changes).

---

## 8. Testar no computador (opcional)

Se quiser ver o site antes de publicar, com o Python instalado, abra o terminal na pasta do projeto e rode:

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000 no navegador. (Abrir o `index.html` com clique duplo **não funciona**: o navegador bloqueia a leitura do `presentes.json`.)

Para quem programa: `npm test` roda os testes automáticos das regras da lista.

---

## Arquivos do projeto

| Arquivo | Para que serve | Mexer? |
|---|---|---|
| `presentes.json` | A lista de presentes | ✅ Sim |
| `img/` | Fotos dos presentes e enfeites do site | ✅ Só para enviar/apagar fotos |
| `index.html`, `css/`, `js/` | O código do site | ❌ Não precisa |
| `style-guide.md` | Cores e fontes tiradas do convite do Canva | — |
| `assets-canva/` | Imagens originais do convite (só referência) | — |
| `docs/` | Documentação técnica do projeto | — |

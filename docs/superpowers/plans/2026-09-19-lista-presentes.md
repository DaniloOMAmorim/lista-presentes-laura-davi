# Lista de Presentes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site estático com a lista de presentes de Laura & Davi: grade de presentes lida de `presentes.json`, modal com QR code PIX, "copia e cola" e link de cartão, mais um README para a Laura manter a lista.

**Architecture:** HTML + CSS + ES modules sem build. `js/presentes.js` tem a lógica pura (validação e formatação, testada com `node --test`); `js/app.js` carrega o JSON e monta a grade; `js/modal.js` controla o `<dialog>`. O QR vem de `qrcode-generator` copiado para `js/vendor/`.

**Tech Stack:** HTML5, CSS (custom properties, grid, `<dialog>`), JavaScript ES2022 modules, qrcode-generator 1.4.4, Node 22 (só para testes), Pillow (só para otimizar imagens), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-19-lista-presentes-design.md`

## Global Constraints

- Sem backend, sem build, sem dependências npm. `package.json` existe só para `"type": "module"` e o script de teste.
- Cores e fontes do `style-guide.md`: `--color-bg #EDEAE4`, `--color-text #54473B`, `--color-accent #997338`, `--color-ornament #A29D6A`, `--color-envelope #B4A89C`, `--color-gold #A88448`, `--color-paper #FFFFFF`; Cormorant Garamond + Pinyon Script (Google Fonts).
- Textos visíveis em português do Brasil.
- Colunas da grade: 4 em ≥ 1024px, 3 em ≥ 720px, 2 abaixo. O modal empilha abaixo de 720px.
- Imagens servidas em `img/` com menos de 200 KB cada.
- Conteúdo vindo do JSON é inserido com `textContent`/atributos, nunca com `innerHTML`.
- Os PIX de exemplo usam a chave inválida `00000000-0000-0000-0000-000000000000`, para nenhum pagamento de teste ir para a conta de terceiros.

---

### Task 1: Lógica pura — validação e formatação

**Files:**
- Create: `package.json`
- Create: `js/presentes.js`
- Test: `tests/presentes.test.js`

**Interfaces:**
- Produces:
  - `formatarPreco(centavos: number) → string` (ex.: `"R$ 450,00"`, com espaço não separável depois de `R$`)
  - `validarPresente(item: unknown) → { ok: boolean, erros: string[] }`
  - `prepararLista(dados: unknown) → { presentes: Presente[], avisos: string[] }`; lança `Error` se `dados.presentes` não for array.
  - `Presente = { id, title, description?, url_img, price_in_cents, pix_code, link_payment? }` (com `pix_code` sem espaços nas pontas)

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "lista-presentes-laura-davi",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Escrever os testes que falham** — `tests/presentes.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarPreco, validarPresente, prepararLista } from '../js/presentes.js';

// Intl usa espaço não separável depois de "R$"; normalizamos para comparar.
const normalizar = (texto) => texto.replace(/\s/g, ' ');

const presenteValido = () => ({
  id: 'jogo-de-panelas',
  title: 'Jogo de panelas',
  url_img: 'img/panelas.webp',
  price_in_cents: 45000,
  pix_code: '00020126580014BR.GOV.BCB.PIX6304ABCD',
});

test('formatarPreco formata centavos em reais', () => {
  assert.equal(normalizar(formatarPreco(45000)), 'R$ 450,00');
  assert.equal(normalizar(formatarPreco(1990)), 'R$ 19,90');
  assert.equal(normalizar(formatarPreco(5)), 'R$ 0,05');
  assert.equal(normalizar(formatarPreco(123456789)), 'R$ 1.234.567,89');
});

test('validarPresente aceita um presente completo', () => {
  assert.deepEqual(validarPresente(presenteValido()), { ok: true, erros: [] });
});

test('validarPresente aceita campos opcionais preenchidos ou vazios', () => {
  const comOpcionais = { ...presenteValido(), description: 'Para cozinhar juntos', link_payment: 'https://mpago.la/abc' };
  assert.equal(validarPresente(comOpcionais).ok, true);
  assert.equal(validarPresente({ ...presenteValido(), link_payment: '' }).ok, true);
});

test('validarPresente aceita imagem por URL https', () => {
  assert.equal(validarPresente({ ...presenteValido(), url_img: 'https://exemplo.com/foto.jpg' }).ok, true);
});

for (const campo of ['id', 'title', 'url_img', 'price_in_cents', 'pix_code']) {
  test(`validarPresente acusa falta de ${campo}`, () => {
    const item = presenteValido();
    delete item[campo];
    const resultado = validarPresente(item);
    assert.equal(resultado.ok, false);
    assert.ok(resultado.erros.some((erro) => erro.includes(`falta ${campo}`)), resultado.erros.join(' | '));
  });
}

test('validarPresente trata texto só com espaços como faltando', () => {
  const resultado = validarPresente({ ...presenteValido(), title: '   ' });
  assert.ok(resultado.erros.includes('falta title'));
});

test('validarPresente rejeita id com espaço, maiúscula ou acento', () => {
  for (const id of ['jogo de panelas', 'Jogo-de-panelas', 'jogo-de-panelas-ç']) {
    const resultado = validarPresente({ ...presenteValido(), id });
    assert.equal(resultado.ok, false, id);
    assert.match(resultado.erros[0], /id inválido/);
  }
});

test('validarPresente rejeita preço como texto, zero, negativo ou quebrado', () => {
  for (const price_in_cents of ['45000', 0, -100, 450.5]) {
    const resultado = validarPresente({ ...presenteValido(), price_in_cents });
    assert.equal(resultado.ok, false, String(price_in_cents));
    assert.match(resultado.erros[0], /price_in_cents precisa ser um número inteiro/);
  }
});

test('validarPresente rejeita pix_code que não é copia e cola', () => {
  const resultado = validarPresente({ ...presenteValido(), pix_code: 'laura@email.com' });
  assert.equal(resultado.ok, false);
  assert.match(resultado.erros[0], /pix_code inválido/);
});

test('validarPresente rejeita url_img e link_payment fora do padrão', () => {
  assert.match(validarPresente({ ...presenteValido(), url_img: 'C:\\fotos\\a.jpg' }).erros[0], /url_img precisa começar/);
  assert.match(validarPresente({ ...presenteValido(), link_payment: 'http://inseguro.com' }).erros[0], /link_payment precisa começar/);
});

test('validarPresente rejeita algo que não é objeto', () => {
  assert.equal(validarPresente(null).ok, false);
  assert.equal(validarPresente('texto').ok, false);
});

test('prepararLista mantém itens válidos na ordem do arquivo', () => {
  const segundo = { ...presenteValido(), id: 'liquidificador', title: 'Liquidificador' };
  const { presentes, avisos } = prepararLista({ presentes: [presenteValido(), segundo] });
  assert.deepEqual(presentes.map((p) => p.id), ['jogo-de-panelas', 'liquidificador']);
  assert.deepEqual(avisos, []);
});

test('prepararLista descarta inválidos com aviso legível', () => {
  const invalido = { ...presenteValido(), id: 'liquidificador', title: 'Liquidificador', pix_code: '' };
  const { presentes, avisos } = prepararLista({ presentes: [presenteValido(), {}, invalido] });
  assert.equal(presentes.length, 1);
  assert.equal(avisos.length, 2);
  assert.match(avisos[0], /^Presente #2: falta id/);
  assert.equal(avisos[1], 'Presente #3 ("Liquidificador"): falta pix_code');
});

test('prepararLista mantém só o primeiro id repetido', () => {
  const repetido = { ...presenteValido(), title: 'Outro' };
  const { presentes, avisos } = prepararLista({ presentes: [presenteValido(), repetido] });
  assert.equal(presentes.length, 1);
  assert.equal(presentes[0].title, 'Jogo de panelas');
  assert.match(avisos[0], /^Presente #2 \("Outro"\): id "jogo-de-panelas" repetido/);
});

test('prepararLista remove espaços nas pontas do pix_code', () => {
  const { presentes } = prepararLista({ presentes: [{ ...presenteValido(), pix_code: '  000201ABC \n' }] });
  assert.equal(presentes[0].pix_code, '000201ABC');
});

test('prepararLista lança erro quando falta a lista "presentes"', () => {
  assert.throws(() => prepararLista({}), /precisa ter o formato/);
  assert.throws(() => prepararLista([]), /precisa ter o formato/);
  assert.throws(() => prepararLista(null), /precisa ter o formato/);
});
```

- [ ] **Step 3: Rodar os testes e confirmar a falha**

Run: `npm test`
Expected: FAIL com `Cannot find module '.../js/presentes.js'`

- [ ] **Step 4: Implementar** — `js/presentes.js`

```js
// Regras da lista de presentes, sem acesso à página (testáveis com node --test).

const FORMATADOR_BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const ID_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function formatarPreco(centavos) {
  return FORMATADOR_BRL.format(centavos / 100);
}

function preenchido(valor) {
  return typeof valor === 'string' && valor.trim() !== '';
}

export function validarPresente(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return { ok: false, erros: ['não é um bloco { ... } válido'] };
  }

  const erros = [];

  if (!preenchido(item.id)) erros.push('falta id');
  else if (!ID_VALIDO.test(item.id)) erros.push('id inválido: use só letras minúsculas sem acento, números e hífen (ex.: jogo-de-panelas)');

  if (!preenchido(item.title)) erros.push('falta title');

  if (item.description !== undefined && typeof item.description !== 'string') {
    erros.push('description precisa ser um texto entre aspas');
  }

  if (!preenchido(item.url_img)) erros.push('falta url_img');
  else if (!/^(img\/|https:\/\/)/.test(item.url_img)) erros.push('url_img precisa começar com img/ ou https://');

  if (item.price_in_cents === undefined) erros.push('falta price_in_cents');
  else if (!Number.isInteger(item.price_in_cents) || item.price_in_cents <= 0) {
    erros.push('price_in_cents precisa ser um número inteiro maior que zero, sem aspas (ex.: 45000 = R$ 450,00)');
  }

  if (!preenchido(item.pix_code)) erros.push('falta pix_code');
  else if (!item.pix_code.trim().startsWith('000201')) {
    erros.push('pix_code inválido: cole o código "PIX copia e cola" completo (começa com 000201)');
  }

  if (item.link_payment !== undefined && typeof item.link_payment !== 'string') {
    erros.push('link_payment precisa ser um texto entre aspas');
  } else if (preenchido(item.link_payment) && !item.link_payment.startsWith('https://')) {
    erros.push('link_payment precisa começar com https://');
  }

  return { ok: erros.length === 0, erros };
}

export function prepararLista(dados) {
  if (!dados || !Array.isArray(dados.presentes)) {
    throw new Error('presentes.json precisa ter o formato { "presentes": [ ... ] }');
  }

  const presentes = [];
  const avisos = [];
  const idsUsados = new Set();

  dados.presentes.forEach((item, indice) => {
    const nome = item && preenchido(item.title) ? ` ("${item.title}")` : '';
    const rotulo = `Presente #${indice + 1}${nome}`;

    const { ok, erros } = validarPresente(item);
    if (!ok) {
      avisos.push(`${rotulo}: ${erros.join('; ')}`);
      return;
    }
    if (idsUsados.has(item.id)) {
      avisos.push(`${rotulo}: id "${item.id}" repetido, só o primeiro aparece`);
      return;
    }

    idsUsados.add(item.id);
    presentes.push({ ...item, pix_code: item.pix_code.trim() });
  });

  return { presentes, avisos };
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS, todos os testes, 0 falhas

- [ ] **Step 6: Commit**

```bash
git add package.json js/presentes.js tests/presentes.test.js
git commit -m "feat: validação e formatação da lista de presentes"
```

---

### Task 2: Página, grade e modal

**Files:**
- Create: `img/moldura.webp`, `img/selo.webp`, `img/favicon.png`, `img/exemplo.webp` (gerados de `assets-canva/`)
- Create: `js/vendor/qrcode.min.js` (qrcode-generator 1.4.4)
- Create: `presentes.json`
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/modal.js`
- Create: `js/app.js`

**Interfaces:**
- Consumes: `formatarPreco`, `prepararLista` e o tipo `Presente` da Task 1.
- Produces: `abrirModal(presente: Presente) → void` em `js/modal.js`; global `window.qrcode` carregado por `<script defer>`.

- [ ] **Step 1: Gerar as imagens otimizadas**

```bash
python3 - <<'EOF'
from PIL import Image
a = 'assets-canva/'
moldura = Image.open(a + 'moldura-floral.png').convert('RGBA')
moldura.thumbnail((520, 720), Image.LANCZOS)
moldura.save('img/moldura.webp', 'WEBP', quality=82, method=6)

selo = Image.open(a + 'selo-cera.png').convert('RGBA')
selo.thumbnail((160, 160), Image.LANCZOS)
selo.save('img/selo.webp', 'WEBP', quality=85, method=6)
fav = selo.copy(); fav.thumbnail((64, 64), Image.LANCZOS); fav.save('img/favicon.png')

# Foto de exemplo: fundo cor de envelope com o selo no centro.
ex = Image.new('RGBA', (600, 600), (0xB4, 0xA8, 0x9C, 255))
s = selo.copy(); s.thumbnail((150, 150), Image.LANCZOS)
ex.alpha_composite(s, ((600 - s.width) // 2, (600 - s.height) // 2))
ex.convert('RGB').save('img/exemplo.webp', 'WEBP', quality=80, method=6)
EOF
ls -la img/
```
Expected: 4 arquivos, cada um com menos de 200 KB.

- [ ] **Step 2: Copiar a biblioteca de QR**

```bash
mkdir -p js/vendor
curl -sfL https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js -o js/vendor/qrcode.min.js
head -c 40 js/vendor/qrcode.min.js
```
Expected: começa com `var qrcode=function(){`

- [ ] **Step 3: Gerar os PIX de exemplo e escrever `presentes.json`**

Gerar BR Codes válidos (CRC16 correto) com chave inválida, para o QR ser lido por apps de banco, mas nenhum pagamento seguir adiante:

```bash
python3 - <<'EOF'
def campo(id_, valor): return f'{id_}{len(valor):02d}{valor}'
def crc16(dados):
    crc = 0xFFFF
    for b in dados.encode():
        crc ^= b << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) if crc & 0x8000 else crc << 1
            crc &= 0xFFFF
    return f'{crc:04X}'
def pix(valor, txid):
    conta = campo('00', 'BR.GOV.BCB.PIX') + campo('01', '00000000-0000-0000-0000-000000000000')
    corpo = (campo('00', '01') + campo('26', conta) + campo('52', '0000') + campo('53', '986')
             + campo('54', valor) + campo('58', 'BR') + campo('59', 'LAURA E DAVI')
             + campo('60', 'SAO PAULO') + campo('62', campo('05', txid)) + '6304')
    return corpo + crc16(corpo)
for v, t in [('450.00', 'PANELAS'), ('189.90', 'JANTAR'), ('1200.00', 'LUADEMEL')]: print(pix(v, t))
EOF
```

Colar os três códigos em `presentes.json` (substituir `<PIX_...>` pelas linhas impressas, na ordem):

```json
{
  "presentes": [
    {
      "id": "exemplo-jogo-de-panelas",
      "title": "Exemplo: Jogo de panelas",
      "description": "Presente de exemplo. Troque pelos presentes de verdade (veja o README).",
      "url_img": "img/exemplo.webp",
      "price_in_cents": 45000,
      "pix_code": "<PIX_PANELAS>",
      "link_payment": "https://www.mercadopago.com.br"
    },
    {
      "id": "exemplo-jantar-a-dois",
      "title": "Exemplo: Jantar a dois",
      "url_img": "img/exemplo.webp",
      "price_in_cents": 18990,
      "pix_code": "<PIX_JANTAR>"
    },
    {
      "id": "exemplo-lua-de-mel",
      "title": "Exemplo: Cota da lua de mel",
      "description": "Ajude a gente a conhecer um lugar novo juntos.",
      "url_img": "img/exemplo.webp",
      "price_in_cents": 120000,
      "pix_code": "<PIX_LUADEMEL>"
    }
  ]
}
```

Run: `node -e "import('./js/presentes.js').then(m => console.log(m.prepararLista(JSON.parse(require('fs').readFileSync('presentes.json','utf8')))))"`
Expected: 3 presentes, `avisos: []`

- [ ] **Step 4: Escrever `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lista de presentes · Laura &amp; Davi</title>
  <meta name="description" content="Lista de presentes do casamento de Laura e Davi · 10.07.2027">
  <link rel="icon" href="img/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Pinyon+Script&display=swap">
  <link rel="stylesheet" href="css/style.css">
  <script src="js/vendor/qrcode.min.js" defer></script>
  <script src="js/app.js" type="module"></script>
</head>
<body>
  <header class="topo">
    <a class="voltar" href="https://lauraedavi.my.canva.site/dahp8i6lckw">← voltar ao convite</a>
    <div class="moldura">
      <p class="rotulo">Lista de presentes</p>
      <h1 class="nomes">Laura <span class="e">&amp;</span> Davi</h1>
      <p class="data">10.07.2027</p>
    </div>
    <p class="agradecimento">Sua presença é o nosso maior presente. Se quiser nos abençoar com algo a mais, escolha um item abaixo.</p>
    <img class="selo" src="img/selo.webp" alt="" width="72" height="73">
  </header>

  <main class="conteudo">
    <p class="status" id="status" role="status">Carregando a lista…</p>
    <ul class="grade" id="grade"></ul>
  </main>

  <footer class="rodape">Laura &amp; Davi · 10.07.2027</footer>

  <dialog class="modal" id="modal" aria-labelledby="modal-titulo">
    <div class="modal-caixa">
      <button class="modal-fechar" id="modal-fechar" type="button" aria-label="Fechar">×</button>
      <section class="modal-produto">
        <div class="foto"><img id="modal-img" alt=""></div>
        <h2 class="modal-titulo" id="modal-titulo"></h2>
        <p class="preco" id="modal-preco"></p>
        <p class="modal-descricao" id="modal-descricao"></p>
      </section>
      <section class="modal-pagamento" aria-label="Pagamento">
        <p class="modal-rotulo">Presenteie com PIX</p>
        <div class="qr" id="modal-qr" role="img" aria-label="QR code do PIX"></div>
        <label class="pix-rotulo" for="modal-pix">PIX copia e cola</label>
        <textarea class="pix-codigo" id="modal-pix" rows="3" readonly></textarea>
        <button class="botao" id="modal-copiar" type="button">Copiar código</button>
        <p class="dica">Coloque seu nome na mensagem do PIX 💛</p>
        <div class="cartao" id="modal-cartao-bloco">
          <div class="divisor"><span>ou</span></div>
          <a class="botao botao-secundario" id="modal-cartao" target="_blank" rel="noopener">Pagar com cartão</a>
        </div>
      </section>
    </div>
  </dialog>
</body>
</html>
```

- [ ] **Step 5: Escrever `css/style.css`**

```css
:root {
  --color-bg: #EDEAE4;
  --color-text: #54473B;
  --color-accent: #997338;
  --color-ornament: #A29D6A;
  --color-envelope: #B4A89C;
  --color-gold: #A88448;
  --color-paper: #FFFFFF;

  --font-serif: "Cormorant Garamond", Georgia, serif;
  --font-script: "Pinyon Script", cursive;

  --raio: 4px;
  --sombra: 0 1px 2px rgb(84 71 59 / 0.08), 0 8px 24px rgb(84 71 59 / 0.08);
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-serif);
  font-size: 1.125rem;
  line-height: 1.5;
}

body:has(.modal[open]) { overflow: hidden; }

img { max-width: 100%; display: block; }

/* ---------- Topo ---------- */

.topo {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem 1rem;
  text-align: center;
}

.voltar {
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: var(--color-text);
  font-size: 1rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.moldura {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: min(340px, 82vw);
  aspect-ratio: 577 / 800;
  background: url("../img/moldura.webp") center / contain no-repeat;
}

.rotulo {
  margin: 0 0 0.5rem;
  color: var(--color-accent);
  font-size: 0.95rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.nomes {
  display: flex;
  flex-direction: column;
  margin: 0;
  font-family: var(--font-script);
  font-size: clamp(2.4rem, 9vw, 3.2rem);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: 0.12em;
}

.nomes .e { font-size: 0.6em; color: var(--color-ornament); }

.data {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  letter-spacing: 0.25em;
}

.agradecimento {
  max-width: 34rem;
  margin: 1rem 0 0;
  font-size: 1.2rem;
  font-style: italic;
}

.selo { width: 72px; height: auto; margin-top: 1.5rem; }

/* ---------- Grade ---------- */

.conteudo {
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

.status {
  margin: 2rem 0;
  text-align: center;
  font-size: 1.2rem;
}

.grade {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 720px) {
  .grade { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5rem; }
}

@media (min-width: 1024px) {
  .grade { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0 0 1rem;
  border: 0;
  border-radius: var(--raio);
  background: var(--color-paper);
  box-shadow: var(--sombra);
  color: inherit;
  font: inherit;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover { transform: translateY(-3px); box-shadow: 0 2px 4px rgb(84 71 59 / 0.1), 0 14px 32px rgb(84 71 59 / 0.14); }
.card:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }

.foto {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--raio) var(--raio) 0 0;
  background: var(--color-envelope);
}

.foto img { width: 100%; height: 100%; object-fit: cover; }

.card-titulo {
  flex: 1;
  margin: 0.75rem 0.75rem 0.25rem;
  font-size: 1.15rem;
  font-weight: 500;
  line-height: 1.25;
}

.preco {
  margin: 0;
  color: var(--color-accent);
  font-size: 1.2rem;
  font-weight: 600;
}

.card-acao {
  margin-top: 0.5rem;
  color: var(--color-text);
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  text-decoration: underline;
  text-transform: uppercase;
  text-underline-offset: 3px;
}

.rodape {
  padding: 2rem 1rem 3rem;
  text-align: center;
  font-size: 1rem;
  letter-spacing: 0.1em;
}

/* ---------- Botões ---------- */

.botao {
  display: inline-block;
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1px solid var(--color-text);
  border-radius: var(--raio);
  background: var(--color-text);
  color: var(--color-paper);
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  cursor: pointer;
}

.botao:hover { background: #3f352c; }
.botao:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

.botao-secundario {
  background: transparent;
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.botao-secundario:hover { background: var(--color-accent); color: var(--color-paper); }

/* ---------- Modal ---------- */

.modal {
  width: min(880px, calc(100% - 2rem));
  max-height: calc(100dvh - 2rem);
  padding: 0;
  border: 0;
  border-radius: var(--raio);
  background: var(--color-paper);
  color: var(--color-text);
  box-shadow: 0 24px 64px rgb(40 32 24 / 0.3);
}

.modal::backdrop {
  background: rgb(84 71 59 / 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.modal-caixa {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2rem;
}

.modal-fechar {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  background: none;
  color: var(--color-text);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
}

.modal-produto { text-align: center; }
.modal-produto .foto { border-radius: var(--raio); }

.modal-titulo {
  margin: 1rem 0 0.25rem;
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 1.2;
}

.modal-produto .preco { font-size: 1.5rem; }

.modal-descricao { margin: 0.75rem 0 0; font-style: italic; }

.modal-pagamento {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
  text-align: center;
}

.modal-rotulo {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.95rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.qr {
  width: min(220px, 100%);
  margin: 0 auto;
  padding: 0.5rem;
  border: 1px solid var(--color-bg);
  border-radius: var(--raio);
}

.qr svg { display: block; width: 100%; height: auto; }
.qr svg path { fill: var(--color-text); }

.pix-rotulo { margin-top: 0.5rem; font-size: 0.95rem; }

.pix-codigo {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-envelope);
  border-radius: var(--raio);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  word-break: break-all;
  resize: none;
}

.dica { margin: 0; font-size: 1rem; font-style: italic; }

.divisor {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.75rem 0;
  color: var(--color-ornament);
  font-style: italic;
}

.divisor::before, .divisor::after {
  content: "";
  flex: 1;
  border-top: 1px solid var(--color-ornament);
}

@media (max-width: 719px) {
  .modal {
    width: calc(100% - 1rem);
    max-height: calc(100dvh - 1rem);
  }

  .modal-caixa {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 2.5rem 1.25rem 1.5rem;
  }

  .modal-produto .foto { width: min(220px, 70%); margin: 0 auto; }
  .voltar { position: static; align-self: flex-start; margin-bottom: 1rem; }
  .topo { padding-top: 1rem; }
}

@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .card:hover { transform: none; }
}
```

- [ ] **Step 6: Escrever `js/modal.js`**

```js
import { formatarPreco } from './presentes.js';

const modal = document.getElementById('modal');
const elementos = {
  img: document.getElementById('modal-img'),
  titulo: document.getElementById('modal-titulo'),
  preco: document.getElementById('modal-preco'),
  descricao: document.getElementById('modal-descricao'),
  qr: document.getElementById('modal-qr'),
  pix: document.getElementById('modal-pix'),
  copiar: document.getElementById('modal-copiar'),
  cartaoBloco: document.getElementById('modal-cartao-bloco'),
  cartao: document.getElementById('modal-cartao'),
};

const TEXTO_COPIAR = 'Copiar código';
let temporizadorCopia;

export function abrirModal(presente) {
  elementos.img.src = presente.url_img;
  elementos.img.alt = presente.title;
  elementos.titulo.textContent = presente.title;
  elementos.preco.textContent = formatarPreco(presente.price_in_cents);
  elementos.descricao.textContent = presente.description ?? '';
  elementos.descricao.hidden = !presente.description;

  elementos.pix.value = presente.pix_code;
  desenharQr(presente.pix_code);
  restaurarBotaoCopiar();

  const link = presente.link_payment?.trim();
  elementos.cartaoBloco.hidden = !link;
  if (link) elementos.cartao.href = link;

  modal.showModal();
  elementos.copiar.focus();
}

function desenharQr(codigo) {
  elementos.qr.replaceChildren();
  const qrcode = window.qrcode;
  if (typeof qrcode !== 'function') {
    elementos.qr.hidden = true;
    return;
  }
  try {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const qr = qrcode(0, 'M');
    qr.addData(codigo);
    qr.make();
    elementos.qr.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    elementos.qr.hidden = false;
  } catch (erro) {
    console.warn('Não foi possível gerar o QR code:', erro);
    elementos.qr.hidden = true;
  }
}

async function copiarCodigo() {
  clearTimeout(temporizadorCopia);
  try {
    await navigator.clipboard.writeText(elementos.pix.value);
    elementos.copiar.textContent = 'Copiado ✓';
  } catch {
    elementos.pix.focus();
    elementos.pix.select();
    elementos.copiar.textContent = 'Código selecionado, copie manualmente';
  }
  temporizadorCopia = setTimeout(restaurarBotaoCopiar, 2500);
}

function restaurarBotaoCopiar() {
  clearTimeout(temporizadorCopia);
  elementos.copiar.textContent = TEXTO_COPIAR;
}

function tratarFalhaImagem() {
  elementos.img.removeAttribute('src');
  elementos.img.alt = '';
}

elementos.copiar.addEventListener('click', copiarCodigo);
elementos.img.addEventListener('error', tratarFalhaImagem);
document.getElementById('modal-fechar').addEventListener('click', () => modal.close());

// O <dialog> ocupa só a área da caixa; um clique nele mesmo (e não num filho) é no fundo.
modal.addEventListener('click', (evento) => {
  if (evento.target === modal) modal.close();
});
```

Nota: o QR é o único `innerHTML`, e o SVG vem da biblioteca a partir do código PIX, não de HTML do JSON.

- [ ] **Step 7: Escrever `js/app.js`**

```js
import { formatarPreco, prepararLista } from './presentes.js';
import { abrirModal } from './modal.js';

const grade = document.getElementById('grade');
const status = document.getElementById('status');

function mostrarStatus(mensagem) {
  status.textContent = mensagem;
  status.hidden = false;
}

function criarCard(presente) {
  const item = document.createElement('li');
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';

  const foto = document.createElement('span');
  foto.className = 'foto';
  const img = document.createElement('img');
  img.src = presente.url_img;
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => img.remove());
  foto.append(img);

  const titulo = document.createElement('span');
  titulo.className = 'card-titulo';
  titulo.textContent = presente.title;

  const preco = document.createElement('span');
  preco.className = 'preco';
  preco.textContent = formatarPreco(presente.price_in_cents);

  const acao = document.createElement('span');
  acao.className = 'card-acao';
  acao.textContent = 'Presentear';

  card.append(foto, titulo, preco, acao);
  card.addEventListener('click', () => abrirModal(presente));
  item.append(card);
  return item;
}

async function carregar() {
  try {
    const resposta = await fetch('presentes.json', { cache: 'no-cache' });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const { presentes, avisos } = prepararLista(await resposta.json());
    avisos.forEach((aviso) => console.warn(`[presentes.json] ${aviso}`));

    if (presentes.length === 0) {
      mostrarStatus('Em breve, novidades por aqui 💛');
      return;
    }
    grade.replaceChildren(...presentes.map(criarCard));
    status.hidden = true;
  } catch (erro) {
    console.error('[presentes.json] Não foi possível carregar a lista:', erro);
    mostrarStatus('Não foi possível carregar a lista. Tente recarregar a página.');
  }
}

carregar();
```

- [ ] **Step 8: Verificar no navegador**

```bash
python3 -m http.server 8000 &   # na raiz do projeto
google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1366,1000 --screenshot=/tmp/desktop.png http://localhost:8000/
google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=390,900 --screenshot=/tmp/mobile.png http://localhost:8000/
```
Expected: topo com moldura e nomes, 3 cards; 4 colunas no computador (3 cards na primeira linha), 2 colunas no celular.

Verificar o modal com um script de Chrome DevTools, ou manualmente: clicar num card → modal com blur, QR visível, código preenchido; "Copiar código" → "Copiado ✓"; ×, Esc e clique fora fecham; o item sem `link_payment` não mostra "Pagar com cartão"; em 390px as colunas empilham.

Casos de erro: renomear `presentes.json` temporariamente → "Não foi possível carregar a lista…"; trocar `url_img` de um item por `img/nao-existe.webp` → card com fundo cor de envelope; apagar o `pix_code` de um item → item some e o console mostra o aviso. Desfazer todas as mudanças depois.

- [ ] **Step 9: Commit**

```bash
git add index.html css js presentes.json img
git commit -m "feat: página da lista de presentes com modal PIX"
```

---

### Task 3: README para a Laura

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: formato do `presentes.json` (Task 1 e 2), mensagens de erro de `validarPresente`, textos da página.

- [ ] **Step 1: Escrever `README.md`** cobrindo, em português simples, as 9 seções da spec: como o site funciona; como gerar o PIX (estático, valor fixo, sem vencimento, testar); adicionar (upload da foto + copiar bloco no JSON pelo GitHub); editar (preço novo = PIX novo); remover (apagar bloco e vírgula); regras do JSON com exemplos certo/errado e jsonlint; solução de problemas (mensagens da página, F12 → Console, histórico do GitHub para desfazer); testar localmente; publicação (GitHub Pages + link no Canva). Mencionar que os 3 presentes de exemplo precisam ser apagados.

- [ ] **Step 2: Conferir** que todo nome de campo, caminho e mensagem citados no README existem de fato no código (`grep` por cada um).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: manual para editar a lista de presentes"
```

---

### Task 4: Verificação final

- [ ] **Step 1:** `npm test` → todos passam.
- [ ] **Step 2:** `du -h img/*` → cada imagem < 200 KB.
- [ ] **Step 3:** Prints de computador e celular, com o modal aberto e fechado, conferidos contra a spec (layout, cores, fontes carregadas).
- [ ] **Step 4:** `git status` limpo.

# Style Guide — Laura & Davi

Extraído do convite no Canva: https://lauraedavi.my.canva.site/dahp8i6lckw

## Cores

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#EDEAE4` | Fundo das páginas (bege-linho) |
| `--color-text` | `#54473B` | Títulos, nomes, links (marrom-café) |
| `--color-accent` | `#997338` | Destaques e frase-convite (dourado envelhecido) |
| `--color-ornament` | `#A29D6A` | Ícones e ornamentos (verde-oliva/sálvia) |
| `--color-on-image` | `#FFFFFF` | Texto sobre imagem/botões |
| `--color-secondary` | `#304254` | Secundária do tema (pouco usada) |

## Tipografia

| Uso | Fonte original (Canva) | Alternativa gratuita (Google Fonts) | Detalhes |
|---|---|---|---|
| Títulos e texto | Roxborough CF | Cormorant Garamond / Playfair Display | Centralizado, `letter-spacing: -0.017em` |
| Nomes do casal | New Icon Script | Pinyon Script / Great Vibes | `letter-spacing: 0.35em` |

## Escala (referência: página de 1366px)

| Elemento | Tamanho | Estilo |
|---|---|---|
| Destaque | 40px | CAIXA ALTA, dourado, `letter-spacing: -0.006em` |
| Título de seção | ~33px | Marrom |
| Nomes do casal | ~27px | Script, letras espaçadas |
| Links | ~15px | Sublinhado, marrom |
| Botão | ~13px | CAIXA ALTA, sublinhado, branco |

## CSS base

```css
:root {
  --color-bg: #EDEAE4;
  --color-text: #54473B;
  --color-accent: #997338;
  --color-ornament: #A29D6A;
  --color-on-image: #FFFFFF;
  --color-secondary: #304254;
  --color-envelope: #B4A89C;
  --color-gold: #A88448;
  --color-leaf: #909050;
  --color-paper: #FFFFFF;

  --font-serif: "Cormorant Garamond", "Playfair Display", Georgia, serif;
  --font-script: "Pinyon Script", "Great Vibes", cursive;
}
```

## Identidade visual (imagens do Canva)

Tema: **convite em envelope com selo de cera**, flores em aquarela brancas e verde-oliva, clima botânico, clássico e delicado.

| Elemento | Arquivo de referência | Descrição |
|---|---|---|
| Selo de cera | `assets-canva/selo-cera.png` | Selo dourado com arabescos; fecha o envelope na capa ("Clique para abrir") |
| Envelope | `assets-canva/envelope.png` | Envelope liso, bege-acinzentado (~`#B4A89C`) |
| Moldura floral | `assets-canva/moldura-floral.png` | Moldura retangular em aquarela: copos-de-leite, anêmonas brancas, folhagem verde-oliva |
| Cartão do convite | `assets-canva/cartao-convite.jpg` | Cartão branco com buquê em aquarela à esquerda, texto centralizado |
| Ícones | — | Presente, calendário e pin de local; silhuetas simples em `#A29D6A` sobre círculo |

Cores complementares tiradas das imagens:

| Token | Hex | Origem |
|---|---|---|
| `--color-envelope` | `#B4A89C` | Envelope |
| `--color-gold` | `#A88448` | Selo de cera (o `#997338` do texto é a versão mais escura) |
| `--color-leaf` | `#909050` | Folhagem da aquarela (próximo do `#A29D6A` dos ícones) |
| `--color-paper` | `#FFFFFF` | Cartão do convite |

Texto do cartão: *"Grandes coisas fez o Senhor por nós. Por isso estamos alegres." — Salmos 126:3* · Laura & Davi · **10.07.2027 • 10H** · Mombaça Park.

Uso no site de presentes: fundo `--color-bg`, cards brancos (`--color-paper`) no estilo do cartão do convite, moldura floral como ornamento no topo, detalhes dourados no preço e nos botões. As imagens em `assets-canva/` são só referência e precisam ser otimizadas (o selo tem 1,5 MB) antes de ir para o site.

## Conteúdo do convite

- Capa: "Você recebeu um convite especial" / "Com alegria, convidamos você para celebrar o nosso casamento." / Laura E Davi / "Clique para abrir"
- Página "Presentes": Lista de presentes · Local (https://share.google/AQuyt9tGcSUXETAJs) · Confirmação de presença (https://confirmarpresenca.com/e/7i156gwy)

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

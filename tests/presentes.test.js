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

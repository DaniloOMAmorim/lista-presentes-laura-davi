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
  // Sem foto: fica só o fundo cor de envelope do .foto.
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

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
  elementos.img.hidden = false;
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
    // Único innerHTML da página: o SVG é gerado pela biblioteca, não vem do JSON.
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

elementos.copiar.addEventListener('click', copiarCodigo);
// Sem foto: esconde a imagem e fica só o fundo cor de envelope do .foto.
elementos.img.addEventListener('error', () => { elementos.img.hidden = true; });
document.getElementById('modal-fechar').addEventListener('click', () => modal.close());

// O <dialog> ocupa só a área da caixa; um clique nele mesmo (e não num filho) é no fundo.
modal.addEventListener('click', (evento) => {
  if (evento.target === modal) modal.close();
});

import { jogadaIA, jogar, livres, notas, outro, vazio, vencedor, type Jogador, type Nivel } from './jogo';

type Modo = 'computador' | 'duas';

const PREFERENCIAS = 'jogo-da-velha';
const ESPERA_IA = 450; // ms: um respiro para a jogada do computador não parecer instantânea

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tabuleiroEl = $('tabuleiro');
const analiseEl = $<HTMLInputElement>('analise');

function lerPreferencias(): { modo: Modo; nivel: Nivel; analise: boolean } {
  const padrao = { modo: 'computador' as Modo, nivel: 'impossivel' as Nivel, analise: false };
  try {
    return { ...padrao, ...JSON.parse(localStorage.getItem(PREFERENCIAS) ?? '{}') };
  } catch {
    return padrao;
  }
}

const estado = {
  ...lerPreferencias(),
  tabuleiro: vazio(),
  vez: 'X' as Jogador,
  quemComeca: 'X' as Jogador,
  placar: { X: 0, O: 0, empate: 0 },
  partida: 0, // identifica a partida, para descartar a jogada do computador se ela já tiver acabado
};

// O computador é sempre o O; a pessoa é o X.
const vezDoComputador = () => estado.modo === 'computador' && estado.vez === 'O';

const casas = Array.from({ length: 9 }, (_, i) => {
  const casa = document.createElement('button');
  casa.type = 'button';
  casa.className = 'casa';
  casa.addEventListener('click', () => jogarNaCasa(i));
  tabuleiroEl.append(casa);
  return casa;
});

function salvarPreferencias() {
  try {
    localStorage.setItem(PREFERENCIAS, JSON.stringify({ modo: estado.modo, nivel: estado.nivel, analise: estado.analise }));
  } catch { /* sem armazenamento, as escolhas valem só nesta visita */ }
}

function jogarNaCasa(i: number) {
  if (estado.tabuleiro[i] || vencedor(estado.tabuleiro) || !livres(estado.tabuleiro).length) return;
  estado.tabuleiro = jogar(estado.tabuleiro, i, estado.vez);
  estado.vez = outro(estado.vez);

  const v = vencedor(estado.tabuleiro);
  if (v) estado.placar[v.jogador]++;
  else if (!livres(estado.tabuleiro).length) estado.placar.empate++;
  else if (vezDoComputador()) agendarComputador();
  render();
}

function agendarComputador() {
  const partida = estado.partida;
  setTimeout(() => {
    if (partida === estado.partida) jogarNaCasa(jogadaIA(estado.tabuleiro, 'O', estado.nivel));
  }, ESPERA_IA);
}

function novaPartida(alternar = true) {
  if (alternar) estado.quemComeca = outro(estado.quemComeca);
  estado.partida++;
  estado.tabuleiro = vazio();
  estado.vez = estado.quemComeca;
  if (vezDoComputador()) agendarComputador();
  render();
}

function textoStatus() {
  const v = vencedor(estado.tabuleiro);
  if (v) return estado.modo === 'computador' ? (v.jogador === 'X' ? 'Você venceu!' : 'O computador venceu.') : `${v.jogador} venceu!`;
  if (!livres(estado.tabuleiro).length) return 'Empate.';
  if (vezDoComputador()) return 'Computador pensando…';
  return estado.modo === 'computador' ? 'Sua vez' : `Vez do ${estado.vez}`;
}

const resultado = (nota: number) => (nota > 0 ? 'vence' : nota < 0 ? 'perde' : 'empata');

function render() {
  const { tabuleiro, modo, nivel, placar } = estado;
  const v = vencedor(tabuleiro);
  const fim = !!v || !livres(tabuleiro).length;
  const bloqueado = fim || vezDoComputador();
  const n = estado.analise && !bloqueado ? notas(tabuleiro, estado.vez) : [];

  casas.forEach((casa, i) => {
    const marca = tabuleiro[i];
    const nota = n[i];
    // A marca vai num span para só ela animar, e não a casa inteira; casas iguais não são refeitas,
    // senão as marcas antigas animariam de novo a cada jogada.
    const conteudo = marca ? `<span>${marca}</span>` : nota == null ? '' : resultado(nota);
    if (casa.innerHTML !== conteudo) casa.innerHTML = conteudo;
    casa.className = `casa ${marca ? marca.toLowerCase() : nota == null ? '' : `nota ${resultado(nota)}`}`;
    casa.classList.toggle('vitoria', !!v?.linha.includes(i));
    casa.disabled = !!marca || bloqueado;
    const linha = Math.floor(i / 3) + 1;
    const coluna = (i % 3) + 1;
    casa.setAttribute('aria-label', `Linha ${linha}, coluna ${coluna}: ${marca ?? (nota == null ? 'livre' : `livre, ${resultado(nota)}`)}`);
  });

  $('status').textContent = textoStatus();
  $('nome-x').textContent = modo === 'computador' ? 'Você (X)' : 'X';
  $('nome-o').textContent = modo === 'computador' ? 'Computador (O)' : 'O';
  $('pontos-x').textContent = String(placar.X);
  $('pontos-o').textContent = String(placar.O);
  $('pontos-empate').textContent = String(placar.empate);
  $('niveis').hidden = modo !== 'computador';
  $('legenda').hidden = !estado.analise;
  analiseEl.checked = estado.analise;

  document.querySelectorAll<HTMLElement>('.seg').forEach((grupo) => {
    const atual = grupo.dataset.opcao === 'modo' ? modo : nivel;
    grupo.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.valor === atual)));
  });
}

document.querySelectorAll<HTMLElement>('.seg').forEach((grupo) => {
  grupo.addEventListener('click', (e) => {
    const valor = (e.target as HTMLElement).closest('button')?.dataset.valor;
    if (!valor) return;
    if (grupo.dataset.opcao === 'modo') estado.modo = valor as Modo;
    else estado.nivel = valor as Nivel;
    salvarPreferencias();
    // Outro adversário ou dificuldade é outra disputa: placar zerado e partida nova.
    estado.placar = { X: 0, O: 0, empate: 0 };
    novaPartida(false);
  });
});

analiseEl.addEventListener('change', () => {
  estado.analise = analiseEl.checked;
  salvarPreferencias();
  render();
});

$('nova').addEventListener('click', () => novaPartida());
$('zerar').addEventListener('click', () => {
  estado.placar = { X: 0, O: 0, empate: 0 };
  render();
});

novaPartida(false);

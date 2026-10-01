// Regras do jogo e a IA. Funções puras, sem DOM, para poderem ser testadas.

export type Jogador = 'X' | 'O';
export type Tabuleiro = (Jogador | null)[];
export type Nivel = 'facil' | 'medio' | 'impossivel';

export const LINHAS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

/** No nível médio, a chance de o computador jogar ao acaso em vez da melhor jogada. */
export const CHANCE_ERRO_MEDIO = 0.4;

export const vazio = (): Tabuleiro => Array(9).fill(null);
export const outro = (j: Jogador): Jogador => (j === 'X' ? 'O' : 'X');
export const livres = (t: Tabuleiro) => t.flatMap((c, i) => (c ? [] : [i]));
export const jogar = (t: Tabuleiro, i: number, j: Jogador): Tabuleiro => t.map((c, k) => (k === i ? j : c));

export function vencedor(t: Tabuleiro): { jogador: Jogador; linha: number[] } | null {
  for (const linha of LINHAS) {
    const [a, b, c] = linha;
    if (t[a] && t[a] === t[b] && t[a] === t[c]) return { jogador: t[a]!, linha };
  }
  return null;
}

const memo = new Map<string, number>();

/**
 * Minimax: a nota da posição para quem joga agora, supondo que os dois lados jogam perfeitamente.
 * Positiva se vence, 0 se empata, negativa se perde. Vencer mais cedo vale mais, então a IA
 * fecha o jogo assim que pode e, perdendo, adia a derrota o máximo possível.
 */
export function minimax(t: Tabuleiro, vez: Jogador): number {
  const chave = t.map((c) => c ?? '-').join('') + vez;
  let nota = memo.get(chave);
  if (nota !== undefined) return nota;
  const opcoes = livres(t);
  if (vencedor(t)) nota = -(opcoes.length + 1); // quem acabou de jogar, o adversário, venceu
  else if (!opcoes.length) nota = 0;
  else nota = Math.max(...opcoes.map((i) => notaDaJogada(t, i, vez)));
  memo.set(chave, nota);
  return nota;
}

// O que é bom para o adversário depois da jogada é ruim para quem jogou. "0 -" evita o -0 do JavaScript.
const notaDaJogada = (t: Tabuleiro, i: number, vez: Jogador) => 0 - minimax(jogar(t, i, vez), outro(vez));

/** A nota de cada casa livre para quem joga agora; casas ocupadas ficam null. */
export const notas = (t: Tabuleiro, vez: Jogador) => t.map((c, i) => (c ? null : notaDaJogada(t, i, vez)));

/** Escolhe a casa do computador. No impossível, sorteia entre as melhores jogadas para variar as partidas. */
export function jogadaIA(t: Tabuleiro, vez: Jogador, nivel: Nivel, sorte = Math.random): number {
  let opcoes = livres(t);
  const errar = nivel === 'facil' || (nivel === 'medio' && sorte() < CHANCE_ERRO_MEDIO);
  if (!errar) {
    const n = notas(t, vez);
    const melhor = Math.max(...opcoes.map((i) => n[i]!));
    opcoes = opcoes.filter((i) => n[i] === melhor);
  }
  return opcoes[Math.floor(sorte() * opcoes.length)];
}

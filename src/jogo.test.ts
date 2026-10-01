import { describe, expect, it } from 'vitest';
import { jogadaIA, jogar, livres, minimax, notas, outro, vazio, vencedor, type Jogador, type Tabuleiro } from './jogo';

const tab = (s: string): Tabuleiro => [...s].map((c) => (c === '-' ? null : (c as Jogador)));

describe('vencedor', () => {
  it('reconhece linha, coluna e diagonal', () => {
    expect(vencedor(tab('XXX-OO---'))).toEqual({ jogador: 'X', linha: [0, 1, 2] });
    expect(vencedor(tab('OX-OX-O--'))).toEqual({ jogador: 'O', linha: [0, 3, 6] });
    expect(vencedor(tab('X-O-XO--X'))).toEqual({ jogador: 'X', linha: [0, 4, 8] });
  });

  it('não aponta vencedor sem três em linha', () => {
    expect(vencedor(vazio())).toBeNull();
    expect(vencedor(tab('XOXXOOOXX'))).toBeNull();
  });
});

describe('minimax', () => {
  it('jogo perfeito desde o início termina empatado', () => {
    expect(minimax(vazio(), 'X')).toBe(0);
  });

  it('marca como vitória a casa que fecha a linha', () => {
    const n = notas(tab('XX-OO----'), 'X');
    expect(n[2]).toBeGreaterThan(0);
    expect(n[0]).toBeNull();
  });
});

describe('jogadaIA', () => {
  it('vence quando pode, em vez de só bloquear', () => {
    expect(jogadaIA(tab('XX-OO----'), 'O', 'impossivel')).toBe(5);
  });

  it('bloqueia a vitória do adversário', () => {
    expect(jogadaIA(tab('XX--O----'), 'O', 'impossivel')).toBe(2);
  });

  it('no fácil, joga em qualquer casa livre', () => {
    const t = tab('XX--O----');
    expect(jogadaIA(t, 'O', 'facil', () => 0)).toBe(livres(t)[0]);
  });

  it('no médio, às vezes erra e às vezes joga o melhor', () => {
    const t = tab('XX--O----');
    const sorteios = (...v: number[]) => () => v.shift()!;
    expect(jogadaIA(t, 'O', 'medio', sorteios(0, 0.99))).toBe(8); // erra: sorteia entre as livres
    expect(jogadaIA(t, 'O', 'medio', sorteios(0.99, 0))).toBe(2); // não erra: bloqueia
  });

  // Testa todas as sequências de jogadas possíveis da pessoa contra o nível impossível.
  function nuncaPerde(t: Tabuleiro, vez: Jogador, ia: Jogador): boolean {
    const v = vencedor(t);
    if (v) return v.jogador === ia;
    if (!livres(t).length) return true;
    if (vez === ia) return nuncaPerde(jogar(t, jogadaIA(t, ia, 'impossivel', () => 0), ia), outro(vez), ia);
    return livres(t).every((i) => nuncaPerde(jogar(t, i, vez), outro(vez), ia));
  }

  it('no impossível, nunca perde, começando ou não', () => {
    expect(nuncaPerde(vazio(), 'X', 'O')).toBe(true);
    expect(nuncaPerde(vazio(), 'X', 'X')).toBe(true);
  });
});

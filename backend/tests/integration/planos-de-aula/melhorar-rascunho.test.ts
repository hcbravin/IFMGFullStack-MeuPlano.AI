import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlanoDeAulaRascunho } from '../../../src/modulos/planos-de-aula/plano-de-aula.tipos';

const { gerarJsonMock } = vi.hoisted(() => {
    return { gerarJsonMock: vi.fn() };
});

vi.mock('../../../src/modulos/ia/ia.servico', () => {
    class IaServicoFalso {
        gerarJson = gerarJsonMock;
    }
    return { IaServico: IaServicoFalso };
});

import app from '../../../src/app';

// Rascunho válido e completo, usado como entrada da rota.
const rascunhoValido: PlanoDeAulaRascunho = {
    titulo: 'Introdução à Engenharia de Software',
    disciplina: 'Engenharia de Software',
    curso: 'Graduação em Computação',
    nivel: 'Iniciante',
    duracao: '50 minutos',
    tema: 'Conceitos iniciais de Engenharia de Software',
    objetivos: [
        'Compreender o conceito de Engenharia de Software.',
        'Diferenciar desenvolvimento ad hoc de processos sistemáticos.',
    ],
    conteudos: [
        'Definição de Engenharia de Software',
        'Noções de processo de software',
    ],
    metodologia: 'Aula expositiva dialogada com exemplos de sistemas reais.',
    recursos: ['Projetor', 'Computador', 'Slides'],
    avaliacao: 'Participação dos estudantes na discussão orientada.',
};

describe('POST /planos-de-aula/rascunho/melhorar', () => {
    beforeEach(() => {
        gerarJsonMock.mockReset();
    });

    it('deve melhorar um rascunho existente a partir das orientações do professor', async () => {
        const rascunhoMelhoradoPelaIa: PlanoDeAulaRascunho = {
            ...rascunhoValido,
            metodologia:
                'Aula expositiva dialogada combinada com uma atividade prática em grupo.',
            recursos: ['Projetor', 'Computador', 'Slides', 'Fichas de atividade'],
        };

        gerarJsonMock.mockResolvedValue(rascunhoMelhoradoPelaIa);

        const resposta = await request(app)
            .post('/planos-de-aula/rascunho/melhorar')
            .send({
                rascunho: rascunhoValido,
                orientacoes: 'Deixe a metodologia mais ativa e inclua uma atividade em grupo.',
            });

        expect(resposta.status).toBe(200);
        expect(resposta.body).toEqual({
            sucesso: true,
            mensagem: 'Rascunho do plano de aula melhorado com sucesso.',
            dados: rascunhoMelhoradoPelaIa,
        });
        expect(gerarJsonMock).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 quando o rascunho não for enviado', async () => {
        const resposta = await request(app)
            .post('/planos-de-aula/rascunho/melhorar')
            .send({ orientacoes: 'Deixe a aula mais prática.' });

        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({
            sucesso: false,
            mensagem: 'O rascunho do plano de aula é obrigatório.',
            dados: null,
        });
        expect(gerarJsonMock).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando as orientações não forem enviadas', async () => {
        const resposta = await request(app)
            .post('/planos-de-aula/rascunho/melhorar')
            .send({ rascunho: rascunhoValido });

        expect(resposta.status).toBe(400);
        expect(resposta.body).toEqual({
            sucesso: false,
            mensagem: 'As orientações para melhoria do rascunho são obrigatórias.',
            dados: null,
        });
        expect(gerarJsonMock).not.toHaveBeenCalled();
    });

    it('deve retornar erro 500 quando o serviço de IA falhar', async () => {
        gerarJsonMock.mockRejectedValue(new Error('Falha simulada na IA.'));

        const resposta = await request(app)
            .post('/planos-de-aula/rascunho/melhorar')
            .send({
                rascunho: rascunhoValido,
                orientacoes: 'Deixe a metodologia mais ativa.',
            });

        expect(resposta.status).toBe(500);
        expect(resposta.body).toEqual({
            sucesso: false,
            mensagem: 'Falha simulada na IA.',
            dados: null,
        });
    });
});
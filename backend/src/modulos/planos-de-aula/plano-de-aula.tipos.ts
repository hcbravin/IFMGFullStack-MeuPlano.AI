/**
 * Reprenta um rascunho estrutura de plano de aula
 * POST /planos-de-aula/rascunho
 */
export type PlanoDeAulaRascunho = {
    titulo: string;
    disciplina: string;
    curso: string;
    nivel: string;
    duracao: string;
    tema: string;
    objetivos: string[];
    conteudos: string[];
    metodologia: string;
    recursos: string[];
    avaliacao: string;
}

/**
 * Dados necessários para gerar o primeiro plano (rascunho)
 * POST /planos-de-aula/rascunho
 */
export type DadosGerarRascunho = {
    descricao: string;
}

/**
 * Dados necessários para melhorar o rascunho
 * POST /planos-de-aula/rascunho/melhorar
 */
export type DodosMelhorarRascunho = {
    rascunhoAtual: PlanoDeAulaRascunho;
    instrucoes: string;
}

/**
 * Dados necessários para gerar a versão final do plano de aula
 * POST /planos-de-aula/final
 */
export type DadosGerarPlanoFinal = {
    rascunhoRevisado: PlanoDeAulaRascunho;
}

/**
 * Representa o plano de aula final
 */
export type PlanoDeAulaFinal = {
    titulo: string;
    plano: PlanoDeAulaRascunho
    relatorio: string
}

/**
 * Reposta da API de IA
 */
export type RespostaApi<T> = {
    sucesso: boolean;
    mensagem: string;
    dados:T;
}
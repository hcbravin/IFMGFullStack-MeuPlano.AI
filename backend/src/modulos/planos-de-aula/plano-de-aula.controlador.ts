// Importações necessárias para o controlador
import { Request, Response } from 'express';

// Importação do serviço de planos de aula
import { PlanoDeAulaServico, type PlanoDeAulaFinal } from './plano-de-aula.servico';

// Importação do rascunho do plano de aula
import type { PlanoDeAulaRascunho } from './plano-de-aula.tipos';

// Importação dos esquemas de validação (Zod) e do utilitário que os executa.

// Validamos a ENTRADA aqui mesmo, no controlador, SEM middleware de validação.
import {
  esquemaGerarRascunho,
  esquemaMelhorarRascunho,
  esquemaGerarPlanoFinal,
  validarComEsquema,
} from './plano-de-aula.validacao'

/**
 * Controlador responsável por receber as requisições HTTP relacionadas
 * ao módulo de planos de aula.
 *
 * O controlador atua como uma ponte entre a rota HTTP e o serviço de aplicação.
 */
class PlanoDeAulaControlador {
  /**
   * Serviço responsável pela lógica de aplicação dos planos de aula.
   */
  private planoDeAulaServico: PlanoDeAulaServico;

  /**
   * Cria uma instância do controlador de planos de aula.
   */
  constructor() {
    this.planoDeAulaServico = new PlanoDeAulaServico();
  }

  /**
   * Gera um rascunho de plano de aula a partir de uma descrição em linguagem natural.
   *
   * Endpoint relacionado:
   * POST /planos-de-aula/rascunho
   * 
   * Corpo esperado:
   * {
   *   "descricao": "Crie um plano de aula sobre introdução à engenharia de software..."
   * }
   *
   * @param req Objeto da requisição HTTP do Express.
   * @param res Objeto da resposta HTTP do Express.
   * @returns Resposta HTTP contendo o rascunho do plano de aula ou uma mensagem de erro.
   */
  gerarRascunho = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      /**
       * Validação de entrada com Zod (sem middleware): aplicamos o esquema
       * diretamente sobre o corpo da requisição. A mensagem de erro segue o
       * contrato definido no Swagger.
       */
      const validacao = validarComEsquema(esquemaGerarRascunho, req.body);

      if (!validacao.sucesso) {
        return res.status(400).json({
          sucesso: false,
          mensagem: validacao.mensagem,
        });
      }

      const { descricao } = validacao.dados;

      /**
       * Capturamos a descrição, ou seja, os campos do plano de aula e devolve um objeto PlanoDeAulaRascunho.
       */
      const rascunho = await this.planoDeAulaServico.gerarRascunho(
        descricao,
      );

      /**
       * Retornamos o rascunho do plano de aula gerado (ainda sem processamento de IA).
       */
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Rascunho do plano de aula gerado com sucesso.',
        dados: rascunho,
      });
    } catch (erro) {
      return this.tratarErro(res, erro);
    }
  };

  /**
   * Controlador responsável por melhorar um rascunho de plano de aula já existente.
   *
   * Endpoint esperado:
   * POST /api/planos-de-aula/rascunho/melhorar
   *
   * Corpo esperado:
   * {
   *   "rascunho": { ... },
   *   "orientacoes": "Deixe a metodologia mais ativa e participativa."
   * }
   *
   * @param req Requisição HTTP do Express.
   * @param res Resposta HTTP do Express.
   * @returns Resposta JSON contendo o rascunho melhorado.
   */
  melhorarRascunho = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      /**
       * Validação de entrada com Zod (sem middleware): o esquema cobre tanto a
       * presença/estrutura do rascunho quanto a obrigatoriedade das orientações.
       * Como o rascunho é declarado antes das orientações no esquema, se ambos
       * faltarem a primeira mensagem retornada é a do rascunho.
       */
      const validacao = validarComEsquema(esquemaMelhorarRascunho, req.body);

      if (!validacao.sucesso) {
        return res.status(400).json({
          sucesso: false,
          mensagem: validacao.mensagem,
          dados: null,
        });
      }

      const rascunho: PlanoDeAulaRascunho = validacao.dados.rascunho;
      const { orientacoes } = validacao.dados;

      const rascunhoMelhorado = await this.planoDeAulaServico.melhorarRascunho(
        rascunho,
        orientacoes,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Rascunho do plano de aula melhorado com sucesso.',
        dados: rascunhoMelhorado,
      });
    } catch (erro) {
      return this.tratarErro(res, erro);
    }
  };

  /**
   * Gera a versão final do plano de aula em formato de relatório.
   *
   * Endpoint relacionado:
   *
   * POST /planos-de-aula/final
   *
   * Corpo esperado:
   *
   * {
   *   "rascunho": {
   *     "titulo": "Introdução à Engenharia de Software",
   *     "disciplina": "Engenharia de Software",
   *     "curso": "Graduação em Computação",
   *     "nivel": "Iniciante",
   *     "duracao": "50 minutos",
   *     "tema": "Conceitos iniciais de Engenharia de Software",
   *     "objetivos": ["Compreender o conceito de Engenharia de Software."],
   *     "conteudos": ["Definição de Engenharia de Software"],
   *     "metodologia": "Aula expositiva dialogada.",
   *     "recursos": ["Projetor"],
   *     "avaliacao": "Participação dos estudantes."
   *   }
   * }
   *
   * @param req Objeto da requisição HTTP do Express.
   * @param res Objeto da resposta HTTP do Express.
   * @returns Resposta HTTP contendo o plano final ou uma mensagem de erro.
   */
  /**
 * Gera a versão final do plano de aula
 * 
 * POST /planos-de-aula/final
 * 
 * Body: { rascunhoRevisado: PlanoDeAulaRascunho, sessaoId: string }
 */
  async gerarPlanoFinal(req: Request, res: Response): Promise<void> {
    try {
      const { rascunhoRevisado, sessaoId } = req.body;

      if (!rascunhoRevisado) {
        res.status(400).json({
          sucesso: false,
          mensagem: 'Rascunho revisado é obrigatório',
          dados: null
        });
        return;
      }

      if (!sessaoId) {
        res.status(400).json({
          sucesso: false,
          mensagem: 'Identificador de sessão é obrigatório',
          dados: null
        });
        return;
      }

      const planoFinal = await this.planoDeAulaServico.gerarPlanoFinal(
        rascunhoRevisado,
        sessaoId
      );

      res.status(200).json({
        sucesso: true,
        mensagem: 'Plano final gerado com sucesso',
        dados: planoFinal
      });
    } catch (erro) {
      console.error('Erro ao gerar plano final:', erro);
      res.status(500).json({
        sucesso: false,
        mensagem: erro instanceof Error ? erro.message : 'Erro ao gerar plano final',
        dados: null
      });
    }
  }

  /**
   * Trata erros lançados pela camada de serviço e converte em uma resposta
   * HTTP padronizada.
   *
   * Neste estágio do projeto, as validações simples do corpo da requisição
   * retornam status 400 diretamente nos métodos do controlador.
   *
   * Erros lançados pela camada de serviço retornam status 500, pois podem
   * envolver falhas na IA, JSON inválido retornado pelo modelo ou problemas
   * de configuração.
   *
   * Futuramente, esse método pode evoluir para diferenciar melhor:
   *
   * - erro de validação;
   * - erro de integração externa;
   * - erro interno inesperado.
   *
   * @param res Objeto da resposta HTTP do Express.
   * @param erro Erro capturado no bloco try/catch.
   * @returns Resposta HTTP padronizada de erro.
   */
  private tratarErro(res: Response, erro: unknown): Response {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : 'Erro interno ao processar a solicitação.';

    return res.status(500).json({
      sucesso: false,
      mensagem,
      dados: null,
    });
  }

  /**
 * Lista todos os planos de aula de uma sessão
 * 
 * GET /planos-de-aula
 * 
 * Query: ?sessaoId=...
 */
  async listarPlanos(req: Request, res: Response): Promise<void> {
    try {
      const { sessaoId } = req.query;

      if (!sessaoId || typeof sessaoId !== 'string') {
        res.status(400).json({
          sucesso: false,
          mensagem: 'Identificador de sessão é obrigatório',
          dados: null
        });
        return;
      }

      const planos = await this.planoDeAulaServico.listarPlanos(sessaoId);

      res.status(200).json({
        sucesso: true,
        mensagem: 'Planos recuperados com sucesso',
        dados: planos
      });
    } catch (erro) {
      console.error('Erro ao listar planos:', erro);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao recuperar planos salvos',
        dados: null
      });
    }
  }

  /**
   * Busca um plano específico pelo ID
   * 
   * GET /planos-de-aula/:id
   * 
   * Query: ?sessaoId=...
   */
  async buscarPlano(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sessaoId } = req.query;

      if (!id) {
        res.status(400).json({
          sucesso: false,
          mensagem: 'ID do plano é obrigatório',
          dados: null
        });
        return;
      }

      if (!sessaoId || typeof sessaoId !== 'string') {
        res.status(400).json({
          sucesso: false,
          mensagem: 'Identificador de sessão é obrigatório',
          dados: null
        });
        return;
      }

      const plano = await this.planoDeAulaServico.buscarPlanoPorId(id, sessaoId);

      if (!plano) {
        res.status(404).json({
          sucesso: false,
          mensagem: 'Plano não encontrado',
          dados: null
        });
        return;
      }

      res.status(200).json({
        sucesso: true,
        mensagem: 'Plano recuperado com sucesso',
        dados: plano
      });
    } catch (erro) {
      console.error('Erro ao buscar plano:', erro);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao recuperar plano',
        dados: null
      });
    }
  }

}



export { PlanoDeAulaControlador };
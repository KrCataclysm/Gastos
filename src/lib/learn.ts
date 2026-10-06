export type LearnGroup = "diagnosticar" | "medir" | "agir" | "padronizar";

export const LEARN_GROUPS: Record<LearnGroup, string> = {
  diagnosticar: "Diagnosticar",
  medir: "Medir",
  agir: "Agir",
  padronizar: "Padronizar",
};

export interface LearnItem {
  id: string;
  name: string;
  group: LearnGroup;
  summary: string;
  how: string;
  example: string;
  where?: { to: string; label: string };
}

/** Ferramentas da Gestão da Qualidade traduzidas para a vida financeira do universitário. */
export const LEARN: LearnItem[] = [
  { id: "pareto", name: "Diagrama de Pareto", group: "diagnosticar", summary: "Poucas causas explicam a maior parte do problema (regra 80/20).", how: "Ordene os gastos do maior para o menor e some o acumulado. As categorias que juntas passam de 80% são os “poucos vitais”: comece por elas.", example: "Mensalidade, alimentação e transporte somam 82% do mês. Cortar 10% de alimentação rende mais do que zerar xerox.", where: { to: "/relatorios", label: "Ver no Relatórios" } },
  { id: "ishikawa", name: "Diagrama de Ishikawa", group: "diagnosticar", summary: "Mapa de causa e efeito, também chamado espinha de peixe ou 6M.", how: "Coloque o problema na cabeça e agrupe as causas em Método, Máquina, Mão de obra, Material, Medida e Meio. Pergunte “por quê?” até chegar na causa raiz.", example: "Efeito: estourei o lazer. Mão de obra: saio sem planejar. Método: não defino limite antes. Meio: grupo da turma marca no fim de semana.", where: { to: "/relatorios", label: "Ver no Relatórios" } },
  { id: "gut", name: "Matriz GUT", group: "diagnosticar", summary: "Prioriza causas por Gravidade × Urgência × Tendência.", how: "Dê nota de 1 a 5 para cada critério e multiplique (máximo 125). Ataque primeiro o maior produto.", example: "“Peço delivery quando chego tarde”: G4 × U3 × T4 = 48, acima de “não planejo refeições” (27).", where: { to: "/projetos", label: "Usar num projeto" } },
  { id: "controle", name: "Gráfico de controle", group: "medir", summary: "Mostra se o seu gasto semanal é estável ou se saiu do padrão.", how: "Calcule a média e os limites (média ± 2,66 × amplitude móvel média). Pontos fora dos limites são eventos especiais; 7 seguidos do mesmo lado indicam mudança de patamar.", example: "Média de R$ 74/semana, faixa de R$ 0 a R$ 148. Uma semana de R$ 190 merece investigação: foi aniversário ou hábito novo?", where: { to: "/projetos", label: "Ver num projeto" } },
  { id: "histograma", name: "Histograma", group: "medir", summary: "Mostra como os valores se distribuem, em classes.", how: "Divida a faixa de valores em classes (regra de Sturges: 1 + 3,322·log10 n) e conte quantas semanas caem em cada uma. Dois “morros” sugerem dois tipos de semana.", example: "Muitas semanas perto de R$ 60 e algumas perto de R$ 140: as caras têm algo em comum (fim de semana de saída).", where: { to: "/projetos", label: "Ver num projeto" } },
  { id: "dispersao", name: "Diagrama de dispersão", group: "medir", summary: "Testa se duas coisas variam juntas, com o r de Pearson.", how: "Cada ponto é uma semana: gasto A no eixo x, gasto B no y. r perto de +1 ou −1 indica relação forte; perto de 0, nenhuma. Correlação não prova causa.", example: "Lazer e alimentação com r = 0,71: nas semanas em que você sai mais, também come fora mais.", where: { to: "/relatorios", label: "Ver no Relatórios" } },
  { id: "dmaic", name: "DMAIC", group: "agir", summary: "Método em 5 etapas para melhorar um processo com dados.", how: "Definir o problema e a meta, Medir a situação atual, Analisar as causas, Melhorar com um plano, Controlar para manter o ganho.", example: "Projeto “Reduzir delivery”: de R$ 380 para R$ 250 por mês até dezembro, com plano e acompanhamento.", where: { to: "/projetos", label: "Abrir Projetos" } },
  { id: "5w2h", name: "Plano de ação 5W2H", group: "agir", summary: "Transforma intenção em tarefa com dono e prazo.", how: "Responda O quê, Por quê, Onde, Quando, Quem, Como e Quanto custa. Se alguma resposta falta, o plano ainda não está pronto.", example: "O quê: marmitas. Quando: domingo. Quanto: R$ 60. Como: 2h cozinhando para 5 almoços.", where: { to: "/projetos", label: "Usar num projeto" } },
  { id: "pdca", name: "PDCA", group: "agir", summary: "Ciclo contínuo: Planejar, Fazer, Checar, Agir.", how: "Planeje uma mudança pequena, execute por um período curto, compare com a meta e padronize ou ajuste. Repita.", example: "Mês 1: limite de R$ 150 em lazer. Checar: estourou em R$ 40. Agir: dividir em R$ 35 por semana.", where: { to: "/ferramentas", label: "Abrir Ferramentas" } },
  { id: "5s", name: "Programa 5S", group: "padronizar", summary: "Utilização, Ordenação, Limpeza, Saúde e Autodisciplina aplicados ao dinheiro.", how: "Descarte o que não usa (categorias e contas paradas), classifique tudo, limpe pendências, cuide da saúde financeira e crie o hábito de registrar.", example: "Nota 5S de 93 com Autodisciplina em 67: o ponto fraco é registrar todo dia, não o orçamento.", where: { to: "/checkup", label: "Fazer o check-up" } },
  { id: "ocap", name: "OCAP (plano de reação)", group: "padronizar", summary: "O que fazer quando o processo sai de controle.", how: "Antes de acontecer, escreva: se o gasto passar de X, eu faço Y. Decidir antes evita decidir no impulso.", example: "Se a semana passar de R$ 120, cozinho em casa nas próximas 3 refeições e reviso o orçamento.", where: { to: "/projetos", label: "Definir num projeto" } },
  { id: "poka", name: "Poka-yoke", group: "padronizar", summary: "Dispositivo que impede o erro antes de ele acontecer.", how: "Em vez de confiar na atenção, coloque uma trava: confirmação, limite, aviso. O erro humano é esperado, não culpa.", example: "O Prumo avisa quando um lançamento parece duplicado ou 5 vezes maior que o normal da categoria.", where: { to: "/lancamentos", label: "Fazer um lançamento" } },
];

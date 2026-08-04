export interface CrimeRegra {
  tipo: "dinheiroSujo" | "drogas" | "adicional";
  cada: number;
  multaPorCada: number;
  mesesPorCada?: number;
  texto: string;
}

export interface Crime {
  id: string;
  artigo: string;
  nome: string;
  descricao: string;
  grau: 1 | 2 | 3;
  penaMeses: number;
  multa: number;
  regra?: CrimeRegra;
}

export const GRAUS = [
  { id: 1, label: "Crimes de Primeiro Grau", cor: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  { id: 2, label: "Crimes de Segundo Grau", cor: "text-yellow-300 border-yellow-400/30 bg-yellow-400/10" },
  { id: 3, label: "Crimes de Terceiro Grau", cor: "text-red-300 border-red-400/30 bg-red-400/10" },
] as const;

export const CRIMES: Crime[] = [
  // ================= PRIMEIRO GRAU =================
  { id: "c1", artigo: "Art. 1º", nome: "Desobediência", descricao: "Desobedecer a ordem/solicitação de um oficial ou servidor público.", grau: 1, penaMeses: 5, multa: 10000 },
  { id: "c2", artigo: "Art. 2º", nome: "Trajes Proibidos", descricao: "Utilização de máscara ou coldre e/ou roupas de serviços públicos para fins ilícitos ou de diversão sem comunicação com a autoridade legal.", grau: 1, penaMeses: 5, multa: 10000 },
  { id: "c3", artigo: "Art. 3º", nome: "Resistência a Prisão", descricao: "Indivíduo resistiu a prisão.", grau: 1, penaMeses: 5, multa: 10000 },
  { id: "c4", artigo: "Art. 4º", nome: "Furto a Caixa Registradora / Eletrônico", descricao: "Furto a caixa registradora, ATM ou posse de instrumentos de roubo.", grau: 1, penaMeses: 5, multa: 5000 },
  { id: "c5", artigo: "Art. 5º", nome: "Posse de Dinheiro Sujo", descricao: "Posse de dinheiro sujo.", grau: 1, penaMeses: 5, multa: 5000, regra: { tipo: "dinheiroSujo", cada: 10000, multaPorCada: 2000, texto: "A cada R$10.000 sujo, acrescentar R$2.000 de multa." } },
  { id: "c6", artigo: "Art. 6º", nome: "Furto de Veículo", descricao: "Estar em posse do veículo que não seja seu, ou furtar sem violência e/ou agressão.", grau: 1, penaMeses: 5, multa: 15000 },
  { id: "c7", artigo: "Art. 7º", nome: "Calúnia", descricao: "Proferir afirmações falsas sobre alguém, de forma que ofenda à honra daquela pessoa.", grau: 1, penaMeses: 5, multa: 5000, regra: { tipo: "adicional", cada: 1, multaPorCada: 5000, mesesPorCada: 0, texto: "Somar R$5.000 a cada informação caluniosa adicional e 5 serviços." } },
  { id: "c8", artigo: "Art. 8º", nome: "Difamação", descricao: "Imputação ofensiva atribuída contra a honorabilidade de alguém com a intenção de desacreditá-lo.", grau: 1, penaMeses: 5, multa: 5000 },
  { id: "c9", artigo: "Art. 9º", nome: "Briga", descricao: "Troca de agressões entre 2 ou mais cidadãos.", grau: 1, penaMeses: 5, multa: 5000 },
  { id: "c10", artigo: "Art. 10º", nome: "Ameaça", descricao: "Ameaçar alguém por escrito, palavra ou gesto, para causar-lhe mal.", grau: 1, penaMeses: 5, multa: 5000 },
  { id: "c11", artigo: "Art. 11º", nome: "Uso Indevido de Canais Públicos", descricao: "Utilizar com desordem os canais públicos ou má-fé do mesmo.", grau: 1, penaMeses: 15, multa: 10000 },
  { id: "c12", artigo: "Art. 12º", nome: "Perturbação da Paz", descricao: "Comportamento disruptivo sem sério perigo público.", grau: 1, penaMeses: 5, multa: 5000 },
  { id: "c13", artigo: "Art. 33º", nome: "Incitar Acompanhamento", descricao: "Provocar e/ou incitar acompanhamento policial sem necessidade.", grau: 1, penaMeses: 5, multa: 10000 },
  { id: "c14", artigo: "Art. 34º", nome: "Tentativa de Homicídio", descricao: "Tentar causar a morte de alguém.", grau: 1, penaMeses: 10, multa: 5000 },
  { id: "c15", artigo: "Art. 35º", nome: "Lesão Corporal", descricao: "Causar lesão corporal a alguém.", grau: 1, penaMeses: 5, multa: 6000 },
  { id: "c16", artigo: "Art. 36º", nome: "Conduzir Veículo na Contra Mão", descricao: "Conduzir veículo no sentido contrário da pista.", grau: 1, penaMeses: 0, multa: 15000 },
  { id: "c17", artigo: "Art. 37º", nome: "Conduzir Sem Habilitação", descricao: "Dirigir veículo automotor em via pública sem a devida Permissão para Dirigir ou Habilitação.", grau: 1, penaMeses: 0, multa: 15000 },
  { id: "c18", artigo: "Art. 38º", nome: "Conduzir Motocicleta Sem Capacete", descricao: "Conduzir motocicleta, moto ou ciclomotor sem utilizar o capacete de segurança.", grau: 1, penaMeses: 0, multa: 10000 },

  // ================= SEGUNDO GRAU =================
  { id: "c19", artigo: "Art. 13º", nome: "Desacato", descricao: "Desacatar funcionário no exercício da função ou em razão dela.", grau: 2, penaMeses: 5, multa: 20000, regra: { tipo: "adicional", cada: 1, multaPorCada: 5000, mesesPorCada: 5, texto: "Somar R$5.000 a cada desacato adicional e 5 meses." } },
  { id: "c20", artigo: "Art. 14º", nome: "Tráfico de Drogas", descricao: "Tráfico de entorpecentes.", grau: 2, penaMeses: 5, multa: 10000, regra: { tipo: "drogas", cada: 5, multaPorCada: 1000, texto: "Acrescentar R$1.000 a cada 5 und de drogas." } },
  { id: "c21", artigo: "Art. 15º", nome: "Uso de Equipamento Restrito", descricao: "Utilizar em público qualquer equipamento da polícia ou qualquer tipo de colete balístico.", grau: 2, penaMeses: 10, multa: 15000 },
  { id: "c22", artigo: "Art. 16º", nome: "Faturas em Aberto", descricao: "Faturas não pagas.", grau: 2, penaMeses: 5, multa: 10000 },
  { id: "c23", artigo: "Art. 17º", nome: "Posse de Armamento ou Munição Ilegal", descricao: "Estar em posse de qualquer tipo de armamento ou munição ilegal.", grau: 2, penaMeses: 5, multa: 20000 },
  { id: "c24", artigo: "Art. 18º", nome: "Receptação de Produtos", descricao: "Adquirir, receber, transportar, conduzir ou ocultar coisa que sabe ser produto de crime.", grau: 2, penaMeses: 5, multa: 15000 },
  { id: "c25", artigo: "Art. 19º", nome: "Lei do Silêncio", descricao: "Emissão de som ofensiva ou nociva à saúde, segurança e bem-estar da coletividade.", grau: 2, penaMeses: 5, multa: 15000 },
  { id: "c26", artigo: "Art. 29º", nome: "Coautoria e Participação", descricao: "Concorrer de qualquer modo para a prática de um crime, incidindo nas penas a ele cominadas.", grau: 2, penaMeses: 0, multa: 10000 },
  { id: "c27", artigo: "Art. 288º", nome: "Associação Criminosa", descricao: "Reunir-se e associar-se de forma estável e permanente, três ou mais pessoas, com o objetivo de praticar crimes.", grau: 2, penaMeses: 5, multa: 15000 },

  // ================= TERCEIRO GRAU =================
  { id: "c28", artigo: "Art. 20º", nome: "Falsa Identidade", descricao: "Se passar por advogado, funcionário público ou do governo.", grau: 3, penaMeses: 30, multa: 100000 },
  { id: "c29", artigo: "Art. 21º", nome: "Falsidade Ideológica", descricao: "Criação ou adulteração de documento, público ou particular, com o fito de obter vantagem.", grau: 3, penaMeses: 30, multa: 100000 },
  { id: "c30", artigo: "Art. 22º", nome: "Homicídio", descricao: "Atentar contra a vida de uma pessoa intencionalmente no intuito de matar.", grau: 3, penaMeses: 20, multa: 30000 },
  { id: "c31", artigo: "Art. 23º", nome: "Sequestro", descricao: "Privar alguém de sua liberdade, mediante sequestro ou cárcere privado, contra a sua vontade.", grau: 3, penaMeses: 10, multa: 15000 },
  { id: "c32", artigo: "Art. 24º", nome: "Tráfico de Armas e Coletes Balísticos", descricao: "Estar em posse de mais de 2 armas ou coletes balísticos.", grau: 3, penaMeses: 15, multa: 50000 },
  { id: "c33", artigo: "Art. 25º", nome: "Contrabando", descricao: "Importar ou exportar mercadoria proibida ou que dependa de regularização de órgão público.", grau: 3, penaMeses: 15, multa: 20000 },
  { id: "c34", artigo: "Art. 26º", nome: "Tentativa de Homicídio", descricao: "Tentar causar a morte de alguém.", grau: 3, penaMeses: 8, multa: 15000 },
  { id: "c35", artigo: "Art. 27º", nome: "Posse de Ferramentas de Roubo", descricao: "Estar em posse de ferramentas utilizadas para a prática de roubo.", grau: 3, penaMeses: 5, multa: 10000 },
  { id: "c36", artigo: "Art. 121º", nome: "Homicídio Culposo Leve", descricao: "Causar a morte de outra pessoa sem intenção, por negligência, imprudência ou imperícia (culpabilidade leve).", grau: 3, penaMeses: 0, multa: 5000 },
  { id: "c37", artigo: "Art. 121º", nome: "Homicídio Culposo Grave", descricao: "Causar a morte de outra pessoa sem intenção, por negligência, imprudência ou imperícia (culpabilidade grave).", grau: 3, penaMeses: 0, multa: 10000 },
];

export interface Question {
  id: string;
  category: 'clini' | 'saude' | 'inspecao' | 'deonto';
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: string;
}

export interface Flashcard {
  id: string;
  category: 'clini' | 'saude' | 'inspecao' | 'deonto';
  front: string;
  back: string;
}

export const mockQuestions: Question[] = [
  {
    id: '1',
    category: 'clini',
    text: 'Qual é o agente etiológico principal responsável pela Leishmaniose Visceral Canina no Brasil?',
    type: 'multiple_choice',
    options: ['Leishmania braziliensis', 'Leishmania infantum', 'Trypanosoma cruzi', 'Ehrlichia canis'],
    correctAnswer: 'Leishmania infantum'
  },
  {
    id: '2',
    category: 'clini',
    text: 'A vacina V10 protege o cão contra a raiva.',
    type: 'true_false',
    options: ['Verdadeiro', 'Falso'],
    correctAnswer: 'Falso'
  },
  {
    id: '3',
    category: 'saude',
    text: 'Qual das seguintes zoonoses tem o morcego hematófago Desmodus rotundus como o principal transmisor no ciclo silvestre brasileiro?',
    type: 'multiple_choice',
    options: ['Brucelose', 'Raiva', 'Leptospirose', 'Toxoplasmose'],
    correctAnswer: 'Raiva'
  },
  {
    id: '4',
    category: 'inspecao',
    text: 'De acordo com o RIISPOA, carcaças de bovinos acometidas por cisticercose intensa (infecção generalizada) devem receber qual destinação compulsória?',
    type: 'multiple_choice',
    options: ['Aproveitamento condicional pelo uso do frio', 'Salga e posterior liberação para consumo', 'Condenação total e destruição das carcaças', 'Transformação em embutidos cozidos'],
    correctAnswer: 'Condenação total e destruição das carcaças'
  },
  {
    id: '5',
    category: 'deonto',
    text: 'Segundo o Código de Ética do Médico Veterinário (Resolução CFMV nº 1138/2016), é direito do médico veterinário prescrever medicamentos sem realizar o exame clínico presencial do animal em qualquer circunstância.',
    type: 'true_false',
    options: ['Verdadeiro', 'Falso'],
    correctAnswer: 'Falso'
  },
  {
    id: '6',
    category: 'clini',
    text: 'Um equino apresentando dor abdominal aguda (cólica), mucosas congestas, tempo de preenchimento capilar (TPC) de 4 segundos e refluxo enterogástrico fétido positivo via sonda nasogástrica sugere fortemente uma afecção de qual natureza?',
    type: 'multiple_choice',
    options: ['Obstrutiva simples em cólon maior', 'Estrangulativa ou obstrutiva alta em intestino delgado', 'Impactação primária de ceco', 'Espasmo transitório de flexura pélvica'],
    correctAnswer: 'Estrangulativa ou obstrutiva alta em intestino delgado'
  },
  {
    id: '7',
    category: 'saude',
    text: 'No contexto das doenças erradicadas ou sob controle oficial no Brasil, qual enfermidade de notificação obrigatória imediata atinge os equídeos, gerando sinais respiratórios, cutâneos ou neurológicos, sendo causada pela bactéria Burkholderia mallei?',
    type: 'multiple_choice',
    options: ['Mormo', 'Anemia Infecciosa Equina', 'Garrotilho', 'Encefalomielite Equina'],
    correctAnswer: 'Mormo'
  },
  {
    id: '8',
    category: 'inspecao',
    text: 'O teste de plataforma utilizado na recepção do leite cru na indústria para avaliar indiretamente a estabilidade térmica das proteínas e detectar fraudes por reconstituição ou acidez elevada é o:',
    type: 'multiple_choice',
    options: ['Teste do Alizarol/Álcool', 'Teste de Crioscopia', 'Teste da Redutase', 'Teste de Acidez Dornic'],
    correctAnswer: 'Teste do Alizarol/Álcool'
  }
];

export const mockFlashcards: Flashcard[] = [
  {
    id: '1',
    category: 'clini',
    front: 'Sinal de Nikolsky',
    back: 'Indica descolamento epidérmico quando a pele sã é friccionada. Útil no diagnóstico diferencial de pênfigo foliáceo.'
  },
  {
    id: '2',
    category: 'saude',
    front: 'Período de incubação da Raiva em herbívoros',
    back: 'Geralmente varia de 30 a 90 dias, podendo apresentar variações a depender da carga viral e local da mordedura.'
  },
  {
    id: '3',
    category: 'clini',
    front: 'Principal achado laboratorial na Erliquiose na fase aguda',
    back: 'Trombocitopenia (queda acentuada de plaquetas), frequentemente acompanhada de anemia e leucopenia.'
  },
  {
    id: '4',
    category: 'inspecao',
    front: 'Complexo de Ghon',
    back: 'Lesão primária calcificada pulmonar associada a linfonodos satélites comprometidos, indicativo macroscópico clássico de Tuberculose.'
  },
  {
    id: '5',
    category: 'deonto',
    front: 'Publicidade Vet: Divulgar preços e formas de pagamento',
    back: 'É vedado pelo Código de Ética veicular tabelas de honorários, descontos ou vantagens financeiras em meios de comunicação de massa.'
  },
  {
    id: '6',
    category: 'clini',
    front: 'Corpúsculos de Lentz',
    back: 'Inclusões citoplasmáticas ou intranucleares características de células epiteliais infectadas pelo vírus da Cinomose Canina.'
  },
  {
    id: '7',
    category: 'saude',
    front: 'Notificação compulsória: Categoria do Mormo',
    back: 'Categoria de notificação imediata (em até 24 horas) ao Serviço Oficial (MAPA) diante de qualquer caso suspeito ou confirmado.'
  }
];
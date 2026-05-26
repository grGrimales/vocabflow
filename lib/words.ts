export type Category = "beginner" | "intermediate" | "advanced";
export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "phrase";

export interface Word {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  category: Category;
  partOfSpeech: PartOfSpeech;
}

export const words: Word[] = [
  // Beginner - Nouns
  { id: "w001", word: "apple", translation: "manzana", pronunciation: "/ˈæp.əl/", example: "I eat an apple every morning.", exampleTranslation: "Como una manzana cada mañana.", category: "beginner", partOfSpeech: "noun" },
  { id: "w002", word: "house", translation: "casa", pronunciation: "/haʊs/", example: "She lives in a big house.", exampleTranslation: "Ella vive en una casa grande.", category: "beginner", partOfSpeech: "noun" },
  { id: "w003", word: "water", translation: "agua", pronunciation: "/ˈwɔː.tər/", example: "I drink eight glasses of water a day.", exampleTranslation: "Bebo ocho vasos de agua al día.", category: "beginner", partOfSpeech: "noun" },
  { id: "w004", word: "book", translation: "libro", pronunciation: "/bʊk/", example: "This book is very interesting.", exampleTranslation: "Este libro es muy interesante.", category: "beginner", partOfSpeech: "noun" },
  { id: "w005", word: "dog", translation: "perro", pronunciation: "/dɒɡ/", example: "My dog loves to play outside.", exampleTranslation: "A mi perro le encanta jugar afuera.", category: "beginner", partOfSpeech: "noun" },
  // Beginner - Verbs
  { id: "w006", word: "run", translation: "correr", pronunciation: "/rʌn/", example: "I run every morning to stay healthy.", exampleTranslation: "Corro cada mañana para mantenerme sano.", category: "beginner", partOfSpeech: "verb" },
  { id: "w007", word: "eat", translation: "comer", pronunciation: "/iːt/", example: "We eat dinner together as a family.", exampleTranslation: "Cenamos juntos en familia.", category: "beginner", partOfSpeech: "verb" },
  { id: "w008", word: "sleep", translation: "dormir", pronunciation: "/sliːp/", example: "Children need to sleep at least nine hours.", exampleTranslation: "Los niños necesitan dormir al menos nueve horas.", category: "beginner", partOfSpeech: "verb" },
  { id: "w009", word: "speak", translation: "hablar", pronunciation: "/spiːk/", example: "Do you speak Spanish?", exampleTranslation: "¿Hablas español?", category: "beginner", partOfSpeech: "verb" },
  { id: "w010", word: "learn", translation: "aprender", pronunciation: "/lɜːrn/", example: "She wants to learn how to cook.", exampleTranslation: "Ella quiere aprender a cocinar.", category: "beginner", partOfSpeech: "verb" },
  // Beginner - Adjectives
  { id: "w011", word: "big", translation: "grande", pronunciation: "/bɪɡ/", example: "The elephant is a very big animal.", exampleTranslation: "El elefante es un animal muy grande.", category: "beginner", partOfSpeech: "adjective" },
  { id: "w012", word: "happy", translation: "feliz", pronunciation: "/ˈhæp.i/", example: "She looks very happy today.", exampleTranslation: "Ella parece muy feliz hoy.", category: "beginner", partOfSpeech: "adjective" },
  { id: "w013", word: "cold", translation: "frío", pronunciation: "/koʊld/", example: "The weather is cold in December.", exampleTranslation: "El clima es frío en diciembre.", category: "beginner", partOfSpeech: "adjective" },
  { id: "w014", word: "fast", translation: "rápido", pronunciation: "/fæst/", example: "The cheetah is the fastest animal.", exampleTranslation: "El guepardo es el animal más rápido.", category: "beginner", partOfSpeech: "adjective" },
  { id: "w015", word: "kind", translation: "amable", pronunciation: "/kaɪnd/", example: "It's kind of you to help me.", exampleTranslation: "Es amable de tu parte ayudarme.", category: "beginner", partOfSpeech: "adjective" },
  // Intermediate - Nouns
  { id: "w016", word: "achievement", translation: "logro", pronunciation: "/əˈtʃiːv.mənt/", example: "Graduating was her greatest achievement.", exampleTranslation: "Graduarse fue su mayor logro.", category: "intermediate", partOfSpeech: "noun" },
  { id: "w017", word: "challenge", translation: "desafío", pronunciation: "/ˈtʃæl.ɪndʒ/", example: "Learning a new language is a great challenge.", exampleTranslation: "Aprender un nuevo idioma es un gran desafío.", category: "intermediate", partOfSpeech: "noun" },
  { id: "w018", word: "opportunity", translation: "oportunidad", pronunciation: "/ˌɒp.əˈtʃuː.nɪ.ti/", example: "This job is a wonderful opportunity.", exampleTranslation: "Este trabajo es una oportunidad maravillosa.", category: "intermediate", partOfSpeech: "noun" },
  { id: "w019", word: "behavior", translation: "comportamiento", pronunciation: "/bɪˈheɪ.vjər/", example: "Her behavior at the party was surprising.", exampleTranslation: "Su comportamiento en la fiesta fue sorprendente.", category: "intermediate", partOfSpeech: "noun" },
  { id: "w020", word: "environment", translation: "entorno / medio ambiente", pronunciation: "/ɪnˈvaɪ.rən.mənt/", example: "We must protect the environment.", exampleTranslation: "Debemos proteger el medio ambiente.", category: "intermediate", partOfSpeech: "noun" },
  // Intermediate - Verbs
  { id: "w021", word: "achieve", translation: "lograr", pronunciation: "/əˈtʃiːv/", example: "You can achieve anything if you work hard.", exampleTranslation: "Puedes lograr cualquier cosa si trabajas duro.", category: "intermediate", partOfSpeech: "verb" },
  { id: "w022", word: "consider", translation: "considerar", pronunciation: "/kənˈsɪd.ər/", example: "Please consider my proposal.", exampleTranslation: "Por favor considera mi propuesta.", category: "intermediate", partOfSpeech: "verb" },
  { id: "w023", word: "improve", translation: "mejorar", pronunciation: "/ɪmˈpruːv/", example: "She practiced daily to improve her English.", exampleTranslation: "Ella practicó a diario para mejorar su inglés.", category: "intermediate", partOfSpeech: "verb" },
  { id: "w024", word: "suggest", translation: "sugerir", pronunciation: "/səˈdʒest/", example: "I suggest we leave early.", exampleTranslation: "Sugiero que salgamos temprano.", category: "intermediate", partOfSpeech: "verb" },
  { id: "w025", word: "establish", translation: "establecer", pronunciation: "/ɪˈstæb.lɪʃ/", example: "They want to establish a new company.", exampleTranslation: "Quieren establecer una nueva empresa.", category: "intermediate", partOfSpeech: "verb" },
  // Intermediate - Adjectives
  { id: "w026", word: "ambitious", translation: "ambicioso", pronunciation: "/æmˈbɪʃ.əs/", example: "He is an ambitious young entrepreneur.", exampleTranslation: "Él es un joven empresario ambicioso.", category: "intermediate", partOfSpeech: "adjective" },
  { id: "w027", word: "reliable", translation: "confiable", pronunciation: "/rɪˈlaɪ.ə.bəl/", example: "She is a reliable and honest employee.", exampleTranslation: "Ella es una empleada confiable y honesta.", category: "intermediate", partOfSpeech: "adjective" },
  { id: "w028", word: "significant", translation: "significativo", pronunciation: "/sɪɡˈnɪf.ɪ.kənt/", example: "There was a significant improvement in sales.", exampleTranslation: "Hubo una mejora significativa en las ventas.", category: "intermediate", partOfSpeech: "adjective" },
  { id: "w029", word: "efficient", translation: "eficiente", pronunciation: "/ɪˈfɪʃ.ənt/", example: "The new system is much more efficient.", exampleTranslation: "El nuevo sistema es mucho más eficiente.", category: "intermediate", partOfSpeech: "adjective" },
  { id: "w030", word: "flexible", translation: "flexible", pronunciation: "/ˈflek.sɪ.bəl/", example: "We need a flexible work schedule.", exampleTranslation: "Necesitamos un horario de trabajo flexible.", category: "intermediate", partOfSpeech: "adjective" },
  // Advanced - Nouns
  { id: "w031", word: "ambiguity", translation: "ambigüedad", pronunciation: "/ˌæm.bɪˈɡjuː.ɪ.ti/", example: "The contract was full of legal ambiguity.", exampleTranslation: "El contrato estaba lleno de ambigüedad legal.", category: "advanced", partOfSpeech: "noun" },
  { id: "w032", word: "paradigm", translation: "paradigma", pronunciation: "/ˈpær.ə.daɪm/", example: "This invention shifted the scientific paradigm.", exampleTranslation: "Este invento cambió el paradigma científico.", category: "advanced", partOfSpeech: "noun" },
  { id: "w033", word: "discrepancy", translation: "discrepancia", pronunciation: "/dɪˈskrep.ən.si/", example: "There is a discrepancy in the financial report.", exampleTranslation: "Hay una discrepancia en el informe financiero.", category: "advanced", partOfSpeech: "noun" },
  { id: "w034", word: "inference", translation: "inferencia", pronunciation: "/ˈɪn.fər.əns/", example: "The detective made an inference from the clues.", exampleTranslation: "El detective hizo una inferencia a partir de las pistas.", category: "advanced", partOfSpeech: "noun" },
  { id: "w035", word: "perseverance", translation: "perseverancia", pronunciation: "/ˌpɜː.sɪˈvɪər.əns/", example: "Her perseverance helped her overcome every obstacle.", exampleTranslation: "Su perseverancia la ayudó a superar cada obstáculo.", category: "advanced", partOfSpeech: "noun" },
  // Advanced - Verbs
  { id: "w036", word: "scrutinize", translation: "escudriñar / examinar", pronunciation: "/ˈskruː.tɪ.naɪz/", example: "The committee will scrutinize the report carefully.", exampleTranslation: "El comité examinará el informe cuidadosamente.", category: "advanced", partOfSpeech: "verb" },
  { id: "w037", word: "mitigate", translation: "mitigar", pronunciation: "/ˈmɪt.ɪ.ɡeɪt/", example: "The new policy helped mitigate the risks.", exampleTranslation: "La nueva política ayudó a mitigar los riesgos.", category: "advanced", partOfSpeech: "verb" },
  { id: "w038", word: "articulate", translation: "articular / expresar", pronunciation: "/ɑːˈtɪk.jʊ.leɪt/", example: "She could articulate her ideas clearly.", exampleTranslation: "Ella podía expresar sus ideas claramente.", category: "advanced", partOfSpeech: "verb" },
  { id: "w039", word: "comprehend", translation: "comprender", pronunciation: "/ˌkɒm.prɪˈhend/", example: "It was difficult to comprehend the magnitude of the disaster.", exampleTranslation: "Era difícil comprender la magnitud del desastre.", category: "advanced", partOfSpeech: "verb" },
  { id: "w040", word: "substantiate", translation: "fundamentar / corroborar", pronunciation: "/səbˈstæn.ʃi.eɪt/", example: "He needed evidence to substantiate his claim.", exampleTranslation: "Necesitaba pruebas para fundamentar su afirmación.", category: "advanced", partOfSpeech: "verb" },
  // Advanced - Adjectives
  { id: "w041", word: "meticulous", translation: "meticuloso", pronunciation: "/məˈtɪk.jʊ.ləs/", example: "She is meticulous about her research.", exampleTranslation: "Ella es meticulosa con su investigación.", category: "advanced", partOfSpeech: "adjective" },
  { id: "w042", word: "eloquent", translation: "elocuente", pronunciation: "/ˈel.ə.kwənt/", example: "He gave an eloquent speech at the ceremony.", exampleTranslation: "Él dio un discurso elocuente en la ceremonia.", category: "advanced", partOfSpeech: "adjective" },
  { id: "w043", word: "tenacious", translation: "tenaz", pronunciation: "/tɪˈneɪ.ʃəs/", example: "The tenacious athlete never gave up.", exampleTranslation: "El atleta tenaz nunca se rindió.", category: "advanced", partOfSpeech: "adjective" },
  { id: "w044", word: "pragmatic", translation: "pragmático", pronunciation: "/præɡˈmæt.ɪk/", example: "We need a pragmatic approach to solve this.", exampleTranslation: "Necesitamos un enfoque pragmático para resolver esto.", category: "advanced", partOfSpeech: "adjective" },
  { id: "w045", word: "resilient", translation: "resiliente", pronunciation: "/rɪˈzɪl.i.ənt/", example: "Communities must be resilient in times of crisis.", exampleTranslation: "Las comunidades deben ser resilientes en tiempos de crisis.", category: "advanced", partOfSpeech: "adjective" },
  // Useful phrases
  { id: "w046", word: "on the other hand", translation: "por otro lado", pronunciation: "/ɒn ðə ˈʌð.ər hænd/", example: "It's expensive; on the other hand, it's very durable.", exampleTranslation: "Es caro; por otro lado, es muy duradero.", category: "intermediate", partOfSpeech: "phrase" },
  { id: "w047", word: "in spite of", translation: "a pesar de", pronunciation: "/ɪn spaɪt ɒv/", example: "She succeeded in spite of all difficulties.", exampleTranslation: "Ella tuvo éxito a pesar de todas las dificultades.", category: "intermediate", partOfSpeech: "phrase" },
  { id: "w048", word: "break the ice", translation: "romper el hielo", pronunciation: "/breɪk ðə aɪs/", example: "He told a joke to break the ice.", exampleTranslation: "Contó un chiste para romper el hielo.", category: "intermediate", partOfSpeech: "phrase" },
  { id: "w049", word: "once in a while", translation: "de vez en cuando", pronunciation: "/wʌns ɪn ə waɪl/", example: "I visit my grandparents once in a while.", exampleTranslation: "Visito a mis abuelos de vez en cuando.", category: "beginner", partOfSpeech: "phrase" },
  { id: "w050", word: "hit the nail on the head", translation: "dar en el clavo", pronunciation: "/hɪt ðə neɪl ɒn ðə hed/", example: "Your analysis hit the nail on the head.", exampleTranslation: "Tu análisis dio en el clavo.", category: "advanced", partOfSpeech: "phrase" },
];

export const categoryColors: Record<Category, string> = {
  beginner: "bg-emerald-100 text-emerald-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-purple-100 text-purple-800",
};

export const categoryBorderColors: Record<Category, string> = {
  beginner: "border-emerald-400",
  intermediate: "border-blue-400",
  advanced: "border-purple-400",
};

export const posColors: Record<PartOfSpeech, string> = {
  noun: "bg-orange-100 text-orange-800",
  verb: "bg-rose-100 text-rose-800",
  adjective: "bg-yellow-100 text-yellow-800",
  adverb: "bg-cyan-100 text-cyan-800",
  phrase: "bg-indigo-100 text-indigo-800",
};

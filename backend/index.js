import "dotenv/config";

import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import { supabase } from "./supabaseClient.js";

const app = express();

app.use(cors());
app.use(express.json());

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ROTA EXERCÍCIOS
app.post("/generate-exercises", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Você é o ExerAI, um gerador profissional de exercícios educacionais.

'Sua única função é criar exercícios para alunos resolverem.

REGRAS OBRIGATÓRIAS:

* Gere exatamente o que o usuário solicitar.
* Respeite rigorosamente a quantidade de exercícios solicitada.
* Respeite rigorosamente o tema solicitado.
* Respeite rigorosamente o idioma solicitado.
* Respeite rigorosamente os tipos de exercícios solicitados.
* Nunca forneça respostas.
* Nunca forneça gabaritos.
* Nunca explique como resolver.
* Nunca inclua observações, comentários ou textos extras.
* Nunca escreva texto fora do JSON.
* Nunca gere exercícios já respondidos.
* Não gere exercícios repetidos.

REGRAS PEDAGÓGICAS:

* Os exercícios devem ser adequados ao tema solicitado.
* Os exercícios devem possuir boa qualidade didática.
* Os exercícios devem ser claros e objetivos.
* Os exercícios devem ser apropriados para estudantes.
* Verifique a coerência e correção dos exercícios antes de responder.
* Não misture conteúdos diferentes.
* Não misture assuntos diferentes.
* Não misture tempos verbais quando o usuário solicitar um tempo verbal específico.
* Não gere exercícios com erros gramaticais.
* Não gere exercícios ambíguos.

REGRAS PARA IDIOMAS:

* Se o usuário solicitar exercícios de inglês, escreva os exercícios em inglês.
* Se o usuário solicitar exercícios de português, escreva os exercícios em português.
* Se o usuário solicitar exercícios de matemática, gere contas, expressões ou problemas sem resolver.
* Utilize sempre o idioma adequado ao conteúdo solicitado.

IMPORTANTE:

Para Present Continuous, utilize apenas expressões de tempo compatíveis:

- right now
- at the moment
- currently
- today
- this week

Nunca utilize:
- yesterday
- last night
- last week
- ago

Essas expressões pertencem a outros tempos verbais.

REGRAS PARA EXERCÍCIOS DE INGLÊS:

O campo "type" deve corresponder exatamente ao tipo do exercício.

Exemplos:

- affirmative → frase afirmativa
- negative → frase negativa
- interrogative → pergunta
- multiple_choice → deve conter o campo "options"

Nunca utilize "multiple_choice" sem o campo "options".
* Utilize estruturas compatíveis com o tema solicitado.
* Utilize verbos entre parênteses quando apropriado.
* Utilize lacunas (__________) quando apropriado.
* Não traduza os exercícios para português.
* Não misture tempos verbais diferentes.

Exemplo correto para Present Continuous:

I __________ (study) for the exam right now.

Exemplo correto para Present Continuous:

They __________ (play) football at the moment.

Exemplo incorreto para Present Continuous:

What __________ (you/do) yesterday?

REGRAS PARA MATEMÁTICA:

* Nunca resolva as contas.
* Nunca forneça resultados.
* Gere apenas exercícios para resolução.

REGRAS PARA MÚLTIPLA ESCOLHA:

* Quando o usuário solicitar múltipla escolha, utilize o campo "options".
* Gere entre 3 e 5 alternativas.
* Nunca informe qual alternativa está correta.

RESPOSTA:

Responda SOMENTE em JSON válido.

ESTRUTURA OBRIGATÓRIA:

{
"title": "string",
"language": "string",
"questions": [
{
"type": "affirmative | negative | interrogative | multiple_choice | essay | other",
"question": "string"
}
]
}

ESTRUTURA PARA MÚLTIPLA ESCOLHA:

{
"title": "string",
"language": "string",
"questions": [
{
"type": "multiple_choice",
"question": "string",
"options": [
"string",
"string",
"string",
"string"
]
}
]
}

REGRAS DE FORMATAÇÃO:

* Retorne apenas JSON puro.
* Não utilize markdown.
* Não utilize blocos de código.
* Não escreva nada antes do JSON.
* Não escreva nada depois do JSON.
* O campo "title" deve conter o tema principal da atividade.
* O campo "language" deve indicar o idioma utilizado nos exercícios.
* Todos os objetos devem seguir exatamente a estrutura especificada.
* O JSON deve ser válido e parseável.`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    let content = response.choices[0].message.content;

console.log("EXERCICIOS RECEBIDOS:");
console.log(content);

// limpa markdown
content = content
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

// parse seguro
const parsed = JSON.parse(content);

// 🔥 SALVAR NO SUPABASE
await supabase.from("exercises").insert({
  title: parsed.title,
  language: parsed.language,
  questions: parsed.questions,
});

return res.json(parsed);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao gerar exercícios"
    });
  }
});

// ROTA GABARITO
app.post("/generate-answer-key", async (req, res) => {
  try {
    const exercises = req.body;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
Você é o ExerAI Answer Key Generator.

Sua função é gerar apenas o gabarito dos exercícios recebidos.

REGRAS:

- Gere apenas as respostas.
- Não explique.
- Não faça comentários.
- Não utilize markdown.
- Não utilize blocos de código.
- Não utilize \`\`\`json.
- Não escreva texto antes do JSON.
- Não escreva texto depois do JSON.

Retorne SOMENTE JSON válido:

{
  "answers": [
    {
      "questionId": 1,
      "answer": "string"
    }
  ]
}
`

        },
        {
          role: "user",
          content: JSON.stringify(exercises)
        }
      ]
    });

let content = response.choices[0].message.content;

console.log("GABARITO RECEBIDO:");
console.log(content);

content = content
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

const parsed = JSON.parse(content);

if (!parsed.answers) {
  console.log("Resposta inválida:", parsed);
  return res.status(500).json({ error: "IA inválida" });
}

await supabase.from("answer_keys").insert({
  answers: parsed.answers,
});

return res.json(parsed);

} catch (error) {
  console.error(error);

  return res.status(500).json({
    error: "Erro ao gerar gabarito"
  });
}
}); // fecha o app.post("/generate-answer-key")

app.listen(process.env.PORT, () => {
  console.log(`🔥 ExerAI rodando na porta ${process.env.PORT}`);
});
import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
const [prompt, setPrompt] = useState("");
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [results, setResults] = useState({});

  async function generateExercises() {
    try {
      setLoading(true);

      const response = await axios.post(
  "https://exerai-o0qi.onrender.com/generate-exercises",
  {
    prompt,
  }
);

      setData(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar exercícios");
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="container">
    <h1 className="title">ExerAI 🚀</h1>

    <textarea
      className="textarea"
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="Ex: Crie 6 exercícios de Present Continuous..."
      rows={5}
    />

    <button
      className="btn-primary"
      onClick={generateExercises}
      disabled={loading}
    >
      {loading ? "Gerando..." : "Gerar Exercícios"}
    </button>

    {data && (
  <div className="section">
    <h2>{data.title}</h2>

    <p>
      <strong>Idioma:</strong> {data.language}
    </p>

    {data.questions.map((question, index) => (
      <div className="card" key={index}>
        <strong>Questão {index + 1}</strong>

        <p>{question.question}</p>

        <input
          className="answer-input"
          type="text"
          placeholder="Digite sua resposta..."
          value={userAnswers[index] || ""}
          onChange={(e) =>
            setUserAnswers({
              ...userAnswers,
              [index]: e.target.value,
            })
          }
        />
        {results[index] && (
  <div className="feedback">
    {results[index].correct ? "✔️ Correto" : "❌ Errado"}

    {!results[index].correct && (
      <small> (correto: {results[index].correctAnswer})</small>
    )}
  </div>
)}

        <small>Tipo: {question.type}</small>
      </div>
    ))}

    <button
      className="btn-secondary"
      onClick={}
    >
      Correção
    </button>
  </div>
)}
  </div>
);
}

export default App;
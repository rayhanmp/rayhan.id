import { useState, useRef } from "react";

function getRandomHex(): string {
  const chars = "0123456789ABCDEF";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * 16)]).join("");
}

function getFeedback(target: string, guess: string): string[] {
  return guess.toUpperCase().split("").map((char, idx) => {
    if (char === target[idx]) return "✅";
    return parseInt(char, 16) > parseInt(target[idx], 16) ? "🔼" : "🔽";
  });
}

export default function HexGame() {
  const targetRef = useRef(getRandomHex());
  const target = targetRef.current;

  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<{ guess: string; feedback: string[] }[]>([]);
  const [reveal, setReveal] = useState(false);

  const maxTries = 10;
  const isCorrect = history.some(h => h.guess === target);
  const outOfTries = history.length >= maxTries && !isCorrect;
  const gameOver = isCorrect || outOfTries;

  const handleGuess = () => {
    const clean = guess.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    if (gameOver) return;
    const feedback = getFeedback(target, clean);
    setHistory(prev => [...prev, { guess: clean, feedback }]);
    setGuess("");
  };

  return (
    <div style={{ fontFamily: "Raleway, sans-serif" }}>
      <div
        title="Expected colour"
        style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 1.5rem",
          borderRadius: "12px",
          backgroundColor: `#${target}`,
          border: "2px solid #ccc"
        }}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
      <input
        type="text"
        value={guess}
        onChange={(e) => {
            let input = e.target.value.toUpperCase();
            input = input.startsWith("#") ? input : `#${input}`;
            const sanitized = "#" + input.slice(1).replace(/[^0-9A-F]/g, "").slice(0, 6);
            setGuess(sanitized);
        }}
        onKeyDown={(e) => {
            if ((e.key === "Backspace" || e.key === "Delete") && guess.length <= 1) {
            e.preventDefault();
            }
        }}
        placeholder="#"
        disabled={gameOver}
        style={{
            flex: 1,
            padding: "0.5rem 1rem",
            fontSize: "1.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontFamily: "Raleway, sans-serif"
        }}
        />
        <button
          onClick={handleGuess}
          disabled={gameOver || guess.replace("#", "").length !== 6}
          style={{
            lineHeight: "1",
            padding: "0.5rem 1.2rem",
            fontSize: "1.5rem",
            backgroundColor: gameOver || guess.replace("#", "").length !== 6 ? "#ddd" : "#f5f5f5",
            border: "1px solid #aaa",
            borderRadius: "4px",
            cursor: gameOver || guess.replace("#", "").length !== 6 ? "not-allowed" : "pointer"
          }}
        >
          Submit
        </button>
      </div>

      {guess.length > 0 && guess.replace(/[^0-9A-Fa-f]/g, "").length !== 6 && !gameOver && (
        <div style={{ fontSize: "1.2rem", color: "#666", marginTop: "-1.5rem", marginBottom: "0.75rem" }}>
          Tip: hex must be 6 characters like #FF00FF
        </div>
      )}

      <div>
        <div style={{ fontSize: "2rem", textAlign: "center", fontWeight: "bold", color: "#111", marginBottom: "1rem" }}>
          Your guesses
        </div>

        {history.map((entry, i) => (
          <div
            key={i}
            style={{
              marginBottom: "2rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "2rem"
            }}
          >
            <div style={{ display: "flex", gap: "1rem" }}>
              {entry.guess.split("").map((char, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: "1.5rem" }}>{char}</span>
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: "1.8rem" }}>
                    {entry.feedback[idx]}
                  </span>
                </div>
              ))}
            </div>

            <div
              title={`#${entry.guess}`}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: `#${entry.guess}`,
                border: "1px solid #666",
                boxShadow: "0 0 4px rgba(0,0,0,0.15)"
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        {isCorrect && (
          <p style={{ color: "green", fontWeight: "bold" }}>
            🎉 Correct! The color was #{target}
          </p>
        )}
        {outOfTries && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            ❌ Out of tries! The color was #{target}
          </p>
        )}
        {!gameOver && (
          <p style={{ fontSize: "1.2rem", color: "#666" }}>
            Attempts left: {maxTries - history.length}
          </p>
        )}
      </div>

      {!gameOver && !reveal && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button
            onClick={() => setReveal(true)}
            style={{
              fontSize: "1.4rem",
              color: "#3A5D44",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer"
            }}
          >
            Reveal Answer
          </button>
        </div>
      )}

      {reveal && !gameOver && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <p style={{ fontWeight: 600 }}>Answer: #{target}</p>
        </div>
      )}

      {gameOver && (
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontSize: "1.2rem",
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              border: "1px solid #999",
              backgroundColor: "#f9f9f9",
              cursor: "pointer"
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

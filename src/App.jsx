import { useMemo, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";

const EXERCISES = [
  {
    name: "Jumping jacks",
    unit: "reps",
    ranges: { easy: [10, 20], medium: [20, 35], hard: [35, 50] },
  },
  {
    name: "Push-ups",
    unit: "reps",
    ranges: { easy: [6, 12], medium: [12, 20], hard: [20, 35] },
  },
  {
    name: "Air squats",
    unit: "reps",
    ranges: { easy: [10, 18], medium: [18, 30], hard: [30, 45] },
  },
  {
    name: "Plank",
    unit: "seconds",
    ranges: { easy: [20, 35], medium: [35, 50], hard: [50, 70] },
  },
  {
    name: "Lunges",
    unit: "reps",
    ranges: { easy: [8, 14], medium: [14, 22], hard: [22, 34] },
  },
  {
    name: "Mountain climbers",
    unit: "reps",
    ranges: { easy: [12, 20], medium: [20, 32], hard: [32, 45] },
  },
  {
    name: "Wall sit",
    unit: "seconds",
    ranges: { easy: [20, 30], medium: [30, 45], hard: [45, 70] },
  },
  {
    name: "High knees",
    unit: "reps",
    ranges: { easy: [20, 30], medium: [30, 45], hard: [45, 60] },
  },
  {
    name: "Glute bridges",
    unit: "reps",
    ranges: { easy: [10, 18], medium: [18, 28], hard: [28, 40] },
  },
  {
    name: "Chair tricep dips",
    unit: "reps",
    ranges: { easy: [6, 12], medium: [12, 18], hard: [18, 28] },
  },
  {
    name: "Bicycle crunches",
    unit: "reps",
    ranges: { easy: [12, 20], medium: [20, 30], hard: [30, 45] },
  },
  {
    name: "Side plank",
    unit: "seconds",
    ranges: { easy: [15, 25], medium: [25, 40], hard: [40, 60] },
  },
  {
    name: "Calf raises",
    unit: "reps",
    ranges: { easy: [12, 20], medium: [20, 30], hard: [30, 45] },
  },
  {
    name: "Shadow boxing",
    unit: "seconds",
    ranges: { easy: [20, 35], medium: [35, 50], hard: [50, 70] },
  },
];

const difficultyOptions = [
  {
    value: "easy",
    label: "Easy",
    description: "Quick bursts to keep it light during the break.",
  },
  {
    value: "medium",
    label: "Medium",
    description: "A steady challenge that gets the heart rate up.",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Go all-in before the show comes back on!",
  },
];

const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getExerciseValue = (exercise, difficulty) => {
  const [min, max] = exercise.ranges[difficulty] ?? exercise.ranges.easy;
  return getRandomInt(min, max);
};

const formatExercise = (exercise, value) =>
  `${value} ${exercise.unit} of ${exercise.name}`;

export default function App() {
  const [activeTab, setActiveTab] = useState("wheel");
  const [players, setPlayers] = useLocalStorage("workout-players", []);
  const [history, setHistory] = useLocalStorage("workout-history", []);
  const [playerName, setPlayerName] = useState("");
  const [playerDifficulty, setPlayerDifficulty] = useState("easy");
  const [spinResult, setSpinResult] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const stats = useMemo(() => {
    return players.map((player) => {
      const playerHistory = history.filter(
        (entry) => entry.playerId === player.id
      );
      const lastEntry = playerHistory[0];
      return {
        ...player,
        total: playerHistory.length,
        lastExercise: lastEntry
          ? formatExercise(lastEntry.exercise, lastEntry.value)
          : "No spins yet",
      };
    });
  }, [history, players]);

  const recentHistory = useMemo(() => history.slice(0, 8), [history]);

  const handleAddPlayer = (event) => {
    event.preventDefault();
    if (!playerName.trim()) {
      return;
    }
    const newPlayer = {
      id: crypto.randomUUID(),
      name: playerName.trim(),
      difficulty: playerDifficulty,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    setPlayerName("");
    setPlayerDifficulty("easy");
    setActiveTab("wheel");
  };

  const handleSpin = () => {
    if (!players.length) {
      return;
    }
    const index = Math.floor(Math.random() * EXERCISES.length);
    const exercise = EXERCISES[index];
    const assignments = players.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      difficulty: player.difficulty,
      value: getExerciseValue(exercise, player.difficulty),
    }));

    const segmentAngle = 360 / EXERCISES.length;
    const targetAngle = 360 - (index * segmentAngle + segmentAngle / 2);
    const spins = 3 + Math.floor(Math.random() * 3);
    const nextRotation = wheelRotation + spins * 360 + targetAngle;

    const entry = {
      id: crypto.randomUUID(),
      exercise,
      assignments,
      timestamp: new Date().toISOString(),
    };

    setWheelRotation(nextRotation);
    setSpinResult(entry);
  };

  const handleCompleteSpin = () => {
    if (!spinResult) {
      return;
    }
    const entries = spinResult.assignments.map((assignment) => ({
      id: crypto.randomUUID(),
      playerId: assignment.playerId,
      playerName: assignment.playerName,
      difficulty: assignment.difficulty,
      exercise: spinResult.exercise,
      value: assignment.value,
      timestamp: spinResult.timestamp,
    }));
    setHistory((prev) => [...entries, ...prev]);
    setSpinResult(null);
  };

  const handleRespin = () => {
    setSpinResult(null);
    handleSpin();
  };

  const handleClearStorage = () => {
    setPlayers([]);
    setHistory([]);
    setSpinResult(null);
  };

  const wheelStyle = {
    background: `conic-gradient(${EXERCISES.map((exercise, index) => {
      const hue = 220 + index * 12;
      const start = (index / EXERCISES.length) * 100;
      const end = ((index + 1) / EXERCISES.length) * 100;
      return `hsl(${hue} 85% 88%) ${start}% ${end}%`;
    }).join(", ")})`,
    transform: `rotate(${wheelRotation}deg)`,
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Ad break fitness challenge</p>
        <h1>Spin & Sweat</h1>
        <p className="subtitle">
          Create your squad, spin the wheel, and log quick exercises while the
          ads roll.
        </p>
      </header>

      <main className="panel">
        {activeTab === "wheel" && (
          <section className="wheel-layout">
            <div className="wheel-card">
              <button
                type="button"
                className="wheel-frame"
                onClick={handleSpin}
                disabled={!players.length}
                aria-label="Spin the exercise wheel"
              >
                <div className="wheel" style={wheelStyle} aria-hidden="true" />
                <div className="wheel-pointer" aria-hidden="true" />
                <div className="wheel-labels" aria-hidden="true">
                  {EXERCISES.map((exercise, index) => {
                    const segmentAngle = 360 / EXERCISES.length;
                    const rotation = index * segmentAngle + segmentAngle / 2;
                    return (
                      <span
                        key={exercise.name}
                        className="wheel-label"
                        style={{
                          transform: `rotate(${rotation}deg) translateY(var(--label-offset)) rotate(-${rotation}deg)`,
                        }}
                      >
                        {exercise.name}
                      </span>
                    );
                  })}
                </div>
                <span className="wheel-hint">Tap to spin</span>
              </button>
              <div className="wheel-legend">
                {EXERCISES.map((exercise) => (
                  <span key={exercise.name}>{exercise.name}</span>
                ))}
              </div>
            </div>

            <div className="wheel-controls">
              <p className="spin-instruction">
                Tap the wheel to spin. Everyone does the same move, just with
                their own intensity.
              </p>

              {spinResult && (
                <div className="result">
                  <p className="result-title">Latest spin</p>
                  <p className="result-player">{spinResult.exercise.name}</p>
                  <div className="result-assignments">
                    {spinResult.assignments.map((assignment) => (
                      <div key={assignment.playerId}>
                        <strong>{assignment.playerName}</strong>
                        <span>
                          {assignment.value} {spinResult.exercise.unit} ·{" "}
                          {assignment.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="result-meta">
                    When you&apos;re done, mark it complete to log it.
                  </span>
                  <div className="result-actions">
                    <button className="primary" type="button" onClick={handleCompleteSpin}>
                      Mark exercise complete
                    </button>
                    <button className="ghost" type="button" onClick={handleRespin}>
                      Spin again
                    </button>
                  </div>
                </div>
              )}

              {!players.length && (
                <p className="empty">
                  Add players in settings to start spinning the wheel.
                </p>
              )}
            </div>
          </section>
        )}

        {activeTab === "stats" && (
          <section className="stats">
            <div className="stats-grid">
              {stats.map((player) => (
                <article key={player.id} className="stat-card">
                  <header>
                    <h3>{player.name}</h3>
                    <span className="badge">{player.difficulty}</span>
                  </header>
                  <p className="stat-count">{player.total} spins logged</p>
                  <p className="stat-last">{player.lastExercise}</p>
                </article>
              ))}
            </div>

            <div className="history">
              <h2>Recent spins</h2>
              {recentHistory.length ? (
                <ul>
                  {recentHistory.map((entry) => (
                    <li key={entry.id}>
                      <strong>{entry.playerName}</strong> ·{" "}
                      {formatExercise(entry.exercise, entry.value)}
                      <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">No spins yet. Head to the wheel!</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="settings">
            <div className="settings-form">
              <h2>Add a player</h2>
              <form onSubmit={handleAddPlayer}>
                <label htmlFor="name">Player name</label>
                <input
                  id="name"
                  type="text"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Sam"
                />

                <label htmlFor="difficulty">Difficulty</label>
                <div className="difficulty">
                  {difficultyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={
                        playerDifficulty === option.value ? "is-active" : ""
                      }
                      onClick={() => setPlayerDifficulty(option.value)}
                    >
                      <span>{option.label}</span>
                      <small>{option.description}</small>
                    </button>
                  ))}
                </div>

                <button className="primary" type="submit">
                  Save player
                </button>
              </form>
            </div>

            <div className="settings-list">
              <h2>Saved players</h2>
              {players.length ? (
                <ul>
                  {players.map((player) => (
                    <li key={player.id}>
                      <div>
                        <strong>{player.name}</strong>
                        <span>{player.difficulty}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">No players added yet.</p>
              )}

              <button className="ghost" type="button" onClick={handleClearStorage}>
                Clear all saved data
              </button>
            </div>
          </section>
        )}
      </main>

      <nav className="tabs" aria-label="Workout navigation">
        {[
          { id: "wheel", label: "Wheel" },
          { id: "stats", label: "Stats" },
          { id: "settings", label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab${activeTab === tab.id ? " is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

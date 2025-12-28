import { useEffect, useMemo, useState } from "react";
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
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [spinResult, setSpinResult] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  useEffect(() => {
    if (!selectedPlayerId && players.length) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  const playersById = useMemo(() => {
    return players.reduce((accumulator, player) => {
      accumulator[player.id] = player;
      return accumulator;
    }, {});
  }, [players]);

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
    setSelectedPlayerId(newPlayer.id);
    setActiveTab("wheel");
  };

  const handleSpin = () => {
    if (!selectedPlayerId) {
      return;
    }
    const player = playersById[selectedPlayerId];
    if (!player) {
      return;
    }
    const index = Math.floor(Math.random() * EXERCISES.length);
    const exercise = EXERCISES[index];
    const value = getExerciseValue(exercise, player.difficulty);

    const segmentAngle = 360 / EXERCISES.length;
    const targetAngle = 360 - (index * segmentAngle + segmentAngle / 2);
    const spins = 3 + Math.floor(Math.random() * 3);
    const nextRotation = wheelRotation + spins * 360 + targetAngle;

    const entry = {
      id: crypto.randomUUID(),
      playerId: player.id,
      playerName: player.name,
      difficulty: player.difficulty,
      exercise,
      value,
      timestamp: new Date().toISOString(),
    };

    setWheelRotation(nextRotation);
    setSpinResult(entry);
    setHistory((prev) => [entry, ...prev]);
  };

  const handleClearStorage = () => {
    setPlayers([]);
    setHistory([]);
    setSelectedPlayerId("");
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

      <main className="panel">
        {activeTab === "wheel" && (
          <section className="wheel-layout">
            <div className="wheel-card">
              <div className="wheel-frame">
                <div className="wheel" style={wheelStyle} aria-hidden="true" />
                <div className="wheel-pointer" aria-hidden="true" />
              </div>
              <div className="wheel-legend">
                {EXERCISES.map((exercise) => (
                  <span key={exercise.name}>{exercise.name}</span>
                ))}
              </div>
            </div>

            <div className="wheel-controls">
              <div className="control">
                <label htmlFor="player">Player</label>
                <select
                  id="player"
                  value={selectedPlayerId}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                >
                  <option value="">Select player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} · {player.difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="primary"
                type="button"
                onClick={handleSpin}
                disabled={!selectedPlayerId}
              >
                Spin the wheel
              </button>

              {spinResult && (
                <div className="result">
                  <p className="result-title">Latest spin</p>
                  <p className="result-player">{spinResult.playerName}</p>
                  <strong>{formatExercise(spinResult.exercise, spinResult.value)}</strong>
                  <span className="result-meta">
                    Difficulty: {spinResult.difficulty}
                  </span>
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
    </div>
  );
}

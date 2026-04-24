import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

import './App.css';

const initializeAssistant = (getState) => {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,
      nativePanel: {
        defaultText: 'Скажи команду',
        screenshotMode: false,
        tabIndex: -1,
      },
    });
  } else {
    return createAssistant({ getState });
  }
};

export class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      moods: [],
      clusters: [],
    };

    this.assistant = initializeAssistant(() => this.getStateForAssistant());

    this.assistant.on('data', (event) => {
      console.log('assistant event:', event);

      if (event?.type === 'character' || event?.type === 'insets') {
        return;
      }

      // ВАЖНО: action = сам event
      this.dispatchAssistantAction(event);
    });
  }

  /* =========================
      STATE FOR ASSISTANT
  ========================== */

  getStateForAssistant() {
    return {
      moods: this.state.moods,
    };
  }

  /* =========================
      DISPATCH
  ========================== */

  dispatchAssistantAction(action) {
    if (!action || !action.type) return;

    console.log('ACTION:', action);

    switch (action.type) {
      case 'ADD_MOOD':
        return this.addMood(action);

      case 'REMOVE_LAST_MOOD':
        return this.removeLastMood();

      case 'SHOW_STATS':
        return this.showStats();

      default:
        console.warn('Unknown action:', action);
    }
  }

  /* =========================
      ACTIONS
  ========================== */

  addMood(action) {
    const text = action.payload?.text || '';

    const mood = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      rawPhrase: text,
      moodLabel: this.extractMood(text),
      embedding: [],
      clusterId: null,
      note: null,
    };

    this.setState({
      moods: [...this.state.moods, mood],
    });
  }

  removeLastMood() {
    this.setState({
      moods: this.state.moods.slice(0, -1),
    });
  }

  showStats() {
    const grouped = {};

    this.state.moods.forEach((m) => {
      if (!grouped[m.moodLabel]) {
        grouped[m.moodLabel] = [];
      }
      grouped[m.moodLabel].push(m);
    });

    const clusters = Object.entries(grouped).map(([label, items]) => ({
      name: label,
      members: items,
      color: this.getColor(label),
    }));

    this.setState({ clusters });
  }

  /* =========================
      HELPERS
  ========================== */

  extractMood(text) {
    const t = text.toLowerCase();

    if (t.includes('рад') || t.includes('счаст')) return 'позитивное';
    if (t.includes('груст') || t.includes('печал')) return 'негативное';
    if (t.includes('трев')) return 'тревожное';

    return 'нейтральное';
  }

  getColor(label) {
    switch (label) {
      case 'позитивное':
        return '#4caf50';
      case 'негативное':
        return '#f44336';
      case 'тревожное':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  }

  /* =========================
      UI
  ========================== */

  render() {
    return (
      <div style={{ padding: 20 }}>
        <h2>🎙 Mood Tracker</h2>

        <div style={{ marginBottom: 20 }}>
          <b>Скажи:</b>
          <ul>
            <li>Добавь настроение я рад</li>
            <li>Удали последнее настроение</li>
            <li>Покажи статистику</li>
          </ul>
        </div>

        <h3>📌 Настроения</h3>
        {this.state.moods.length === 0 && <div>Пока пусто</div>}

        {this.state.moods.map((m) => (
          <div key={m.id}>
            {m.rawPhrase} — <b>{m.moodLabel}</b>
          </div>
        ))}

        <h3 style={{ marginTop: 20 }}>📊 Кластеры</h3>

        {this.state.clusters.map((c) => (
          <div key={c.name} style={{ color: c.color }}>
            {c.name}: {c.members.length}
          </div>
        ))}
      </div>
    );
  }
}
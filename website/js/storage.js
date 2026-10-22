window.PPA_STORAGE = (() => {
  const key = 'ppa-explore-v1';
  let available = true;
  const fail = () => {available = false; document.getElementById('storage-notice').hidden = false;};
  return {
    get available() { return available; },
    load() {
      try {
        const probe = key + '-check'; localStorage.setItem(probe, '1'); localStorage.removeItem(probe);
        const raw = localStorage.getItem(key); if (!raw) return null;
        const data = JSON.parse(raw);
        const ids = PPA_VERSIONS[data.version];
        if (data.schema !== 1 || !ids || !Number.isInteger(data.index) || data.index < 0 || data.index >= ids.length || !data.answers || typeof data.answers !== 'object') return null;
        const answers = {};
        for (const id of ids) {
          const a = data.answers[id], q = PPA_QUESTIONS.find(q=>q.id===id);
          if (!a || !Array.isArray(a.values)) continue;
          answers[id] = {values: [...new Set(a.values.filter(v=>q.options.includes(v)))], other: typeof a.other === 'string' ? a.other.slice(0,100) : ''};
        }
        return {schema:1, version:Number(data.version), index:data.index, answers, completed:data.completed === true && ids.every(id=>!PPA_RULES.validate(PPA_QUESTIONS.find(q=>q.id===id),answers[id]))};
      } catch { fail(); return null; }
    },
    save(state) { if (!available) return; try { localStorage.setItem(key, JSON.stringify({schema:1, version:state.version, index:state.index, answers:state.answers, completed:state.completed})); } catch { fail(); } },
    clear() { try { localStorage.removeItem(key); } catch { fail(); } }
  };
})();

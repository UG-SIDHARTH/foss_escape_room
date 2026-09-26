import React, { useState } from 'react';

function LevelView({ level, levelName, levelHero, levelText, onSubmit, onBack, isSubmitting }) {
  const [answer, setAnswer] = useState('');
  
  return (
    <div className="flex-col" style={{ width: '100%', maxWidth: '800px', boxSizing: 'border-box' }}>
      <button onClick={onBack} className="mb-4" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}>
        &lt; BACK TO MISSIONS
      </button>

      <div className="panel mb-8">
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h2 className="text-gold mb-2">&gt; {levelName ? levelName.toUpperCase() : 'UNKNOWN'}</h2>
            <h3 className="text-blue mb-4">HERO: {levelHero ? levelHero.toUpperCase() : 'UNKNOWN'}</h3>
          </div>
          {levelHero && (
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '2px solid var(--accent-magenta)',
              flexShrink: 0
            }}>
              <img 
                src={`/images/${levelHero.toLowerCase().replace(/\s+/g, '-')}.jpg`} 
                alt={levelHero}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
        
        {levelText ? (
          <div className="p-4 mt-4 text-lg" style={{ background: 'rgba(0,240,255,0.05)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {levelText}
          </div>
        ) : (
          <p className="mt-4 text-red">ERROR: CORE DATA CORRUPTED</p>
        )}
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(answer); setAnswer(''); }} className="flex-col gap-4">
        <label className="text-blue font-bold">&gt; INPUT OVERRIDE CODE:</label>
        <div className="flex-row gap-4">
          <input 
            type="text" 
            value={answer} 
            onChange={e => setAnswer(e.target.value)} 
            placeholder="_"
            style={{ flexGrow: 1 }}
          />
          <button type="submit" disabled={isSubmitting || !answer} className="gold">
            &gt; DECRYPT
          </button>
        </div>
      </form>
    </div>
  );
}

export default LevelView;

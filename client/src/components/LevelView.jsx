import React, { useState } from 'react';

function LevelView({ level, levelName, levelText, onSubmit, isSubmitting }) {
  const [answer, setAnswer] = useState('');
  
  return (
    <div className="flex-col" style={{ width: '100%', maxWidth: '600px', boxSizing: 'border-box' }}>
      <div className="mb-4">
        <h2 className="text-amber">&gt; LEVEL {level}: {levelName ? levelName.toUpperCase() : 'UNKNOWN'}</h2>
        
        {levelText ? (
          <div className="p-4 mt-4 text-lg" style={{ border: '1px dashed var(--text-color)', whiteSpace: 'pre-wrap' }}>
            {levelText}
          </div>
        ) : (
          <p className="mt-4 text-red">ERROR: LEVEL DATA NOT FOUND</p>
        )}
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(answer); setAnswer(''); }} className="flex-col gap-4 mt-4">
        <label>&gt; ENTER_SOLUTION:</label>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={answer} 
            onChange={e => setAnswer(e.target.value)} 
            placeholder="_"
            style={{ flexGrow: 1 }}
          />
          <button type="submit" disabled={isSubmitting || !answer}>
            &gt; SUBMIT
          </button>
        </div>
      </form>
    </div>
  );
}

export default LevelView;

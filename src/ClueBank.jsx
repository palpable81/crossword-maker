import './ClueBank.css'

export default function ClueBank({ clueData, clues, activeClueKey, onClueChange }) {
  const { acrossNums, downNums } = clueData

  const renderSection = (nums, dir) => {
    const label = dir === 'across' ? 'Across' : 'Down'
    return (
      <section className="clue-section">
        <h3 className="clue-section-title">{label}</h3>
        {nums.length === 0
          ? <p className="clue-empty">No {label.toLowerCase()} entries yet</p>
          : nums.map(num => {
              const key = `${num}-${dir}`
              return (
                <div key={key} className={`clue-entry${activeClueKey === key ? ' active' : ''}`}>
                  <span className="clue-num">{num}.</span>
                  <input
                    className="clue-input"
                    type="text"
                    maxLength={200}
                    value={clues[key] || ''}
                    onChange={e => onClueChange(key, e.target.value)}
                    placeholder="Enter clue…"
                  />
                </div>
              )
            })
        }
      </section>
    )
  }

  return (
    <div className="clue-bank">
      <h2 className="clue-bank-title">Clues</h2>
      {renderSection(acrossNums, 'across')}
      {renderSection(downNums, 'down')}
    </div>
  )
}

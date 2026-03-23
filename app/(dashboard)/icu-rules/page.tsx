export default function ICURulesPage() {
  const sections = [
    {
      title: 'General Competition Rules', icon: '📋',
      rules: [
        'Routine length: 2 minutes 30 seconds maximum for most divisions.',
        'Music must not contain explicit lyrics. Edited versions must be clean.',
        'Teams must stay within the designated performance area at all times.',
        'Uniforms must be appropriate and meet ICU modesty standards.',
        'Each athlete must have a valid ICU registered membership to compete.',
        'Coaches must be accredited through their national federation.',
        'Props must be approved in advance and cannot be sharp or dangerous.',
        'Teams may not use fire, pyrotechnics, or water-based effects.',
      ],
    },
    {
      title: 'Stunting Rules', icon: '🤸',
      rules: [
        'All extended stunts (above prep level) require a spotter at all times.',
        'Flyers must be caught by at least two bases during dismounts.',
        'Inversions are only permitted in higher skill level divisions (L4+).',
        'No releases above prep level without proper catching requirements.',
        'Basket tosses require two bases, one back spot and one front spot minimum.',
        'Flyers cannot be released during a transition to a new stunt group.',
        'Cradle catches must have the flyer land feet-first into the arms of the bases.',
        'No stunt or pyramid may exceed two-body-height from the performance surface.',
        'Suspended rolls from a pyramid must have continuous contact with a top person.',
      ],
    },
    {
      title: 'Tumbling Rules', icon: '🔄',
      rules: [
        'All aerial skills must be performed on a sprung floor or approved surface.',
        'Standing back tucks are prohibited in Levels 1–2.',
        'Running tumbling passes must start from the ground (no jump entry in L1–L3).',
        'Twisting tumbling (fulls etc.) is restricted to Level 4 and above.',
        'No tumbling over or under another person.',
        'Double fulls are restricted to Level 6 and above.',
        'Athletes must land on their feet — no landing on knees, back or head.',
        'Tumbling near stunt groups must maintain a minimum 1-metre safety gap.',
      ],
    },
    {
      title: 'Pyramid Rules', icon: '🔺',
      rules: [
        'Pyramids may not exceed two-body-height.',
        'All two-high pyramid members must be connected or braced.',
        'Suspended individuals must be in contact with two separate top persons.',
        'Dismounts from pyramids must follow stunt dismount rules.',
        'No inversions in pyramids below Level 4.',
        'Connected pyramids must maintain contact throughout the skill.',
        'Pyramid transitions must be smooth and controlled — no tossing between groups.',
      ],
    },
    {
      title: 'Scoring Breakdown', icon: '🏆',
      rules: [
        'Stunts & Pyramids: up to 30 points — difficulty, technique, execution.',
        'Tumbling: up to 20 points — difficulty, technique, synchronisation.',
        'Jumps: up to 10 points — height, technique, synchronisation.',
        'Dance: up to 10 points — choreography, sharpness, performance.',
        'Cheer: up to 10 points — voice, clarity, crowd engagement.',
        'Overall Performance: up to 20 points — energy, timing, showmanship.',
        'Deductions: illegal skills (5 pts each), out of bounds (0.5 pts), dropped stunt (2 pts), music violations (2 pts).',
      ],
    },
    {
      title: 'Safety & Deductions', icon: '⚠️',
      rules: [
        'Any illegal skill results in an automatic 5-point deduction per occurrence.',
        'A dropped stunt that hits the floor = 2-point deduction.',
        'Out of bounds during performance = 0.5-point deduction per infraction.',
        'Excessive jewellery (non-taped) can result in deductions or disqualification.',
        'If an athlete is injured during the routine, the team may be stopped and given a re-perform.',
        'Coaches must remain off the floor during performance — infraction = 1-point deduction.',
        'Late starts or early finishes beyond 5 seconds = 0.5-point deduction.',
      ],
    },
    {
      title: 'Level Guide (ICU Levels)', icon: '📊',
      rules: [
        'Level 1 — Beginner: Basic stunts to prep, simple tumbling (rolls, cartwheels), no inversions.',
        'Level 2 — Novice: Prep level stunts, back walkovers, no basket tosses.',
        'Level 3 — Intermediate: Extended stunts, limited release moves, standing back handsprings.',
        'Level 4 — Advanced: Full extensions, limited inversions, standing tucks, basket tosses.',
        'Level 5 — Elite: Advanced inversions, twisting releases, running fulls.',
        'Level 6 — World: Double twisting tumbling, complex pyramid releases, elite stunting.',
      ],
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">ICU Cheer Rules</h2>
        <p className="text-gray-400 text-sm mt-1">International Cheer Union — Competition Rules Reference Guide</p>
        <div className="mt-3 bg-yellow-900/30 border border-yellow-800 rounded-xl px-4 py-3 text-yellow-300 text-xs">
          ⚠️ This is a reference guide. Always confirm current rules with the official ICU rulebook at your competition level before competing.
        </div>
      </div>

      <div className="space-y-3">
        {sections.map(section => (
          <details key={section.title} className="card rounded-2xl overflow-hidden group" open>
            <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-700/30 transition list-none">
              <span className="text-xl">{section.icon}</span>
              <span className="text-white font-bold flex-1">{section.title}</span>
              <span className="text-gray-500 text-sm">▼</span>
            </summary>
            <div className="px-5 pb-5 border-t border-gray-700 pt-4">
              <ul className="space-y-2.5">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="text-red-500 mt-0.5 shrink-0">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

const PII_RULES = [
  { entity: 'EMAIL_ADDRESS', replacement: '[EMAIL]', example: 'john@example.com → [EMAIL]' },
  { entity: 'PHONE_NUMBER', replacement: '[PHONE]', example: '555-867-5309 → [PHONE]' },
  { entity: 'US_SSN', replacement: '[SSN]', example: '123-45-6789 → [SSN]' },
  { entity: 'CREDIT_CARD', replacement: '[CARD]', example: '4111 1111 1111 1111 → [CARD]' },
  { entity: 'IP_ADDRESS', replacement: '[IP]', example: '192.168.1.1 → [IP]' },
  { entity: 'PERSON', replacement: '[NAME]', example: 'John Smith → [NAME]' },
]

export function PIIMaskingRules() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-secondary text-sm">
        All data from enterprise connectors is automatically masked before entering model context.
      </p>
      <div className="flex flex-col gap-2">
        {PII_RULES.map(rule => (
          <div
            key={rule.entity}
            className="bg-bg-surface-2 border border-border-default rounded-md p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded">
                {rule.replacement}
              </span>
              <span className="text-text-secondary text-sm">{rule.entity}</span>
            </div>
            <span className="text-text-muted text-xs font-mono">{rule.example}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

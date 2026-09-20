const CQM_ROLE_OPTIONS = ['Voz', 'Batería', 'Guitarra', 'Teclados', 'Bajo', 'Multiinstrumentista']

const CQM_ROLE_META = {
  leader: { label: 'Líder', phrase: 'vos llevás el timón', color: '#22d3a6' },
  drums: { label: 'Batería', phrase: 'sin vos no hay groove', color: '#fb7185' },
  voice: { label: 'Voz', phrase: 'abrís el cielo con tu voz', color: '#c084fc' },
  guitar: { label: 'Guitarra', phrase: 'power chords y fe', color: '#60a5fa' },
  keys: { label: 'Teclados', phrase: 'sin tus pads no hay atmósfera', color: '#22d3ee' },
  bass: { label: 'Bajo', phrase: 'nadie te escucha, todos te sienten', color: '#fbbf24' },
  multi: { label: 'Multiinstrumentista', phrase: 'donde falta alguien, aparecés vos', color: '#34d399' }
}

function cqmRoleKey(role) {
  const value = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (value.includes('lider')) return 'leader'
  if (value.includes('drum') || value.includes('bateria')) return 'drums'
  if (value.includes('cant') || value.includes('coro') || value === 'voz') return 'voice'
  if (value.includes('guitarr')) return 'guitar'
  if (value.includes('pian') || value.includes('tecla') || value.includes('keys')) return 'keys'
  if (value.includes('baj') || value.includes('bass')) return 'bass'
  if (value.includes('multi')) return 'multi'
  return value || 'multi'
}

function cqmRoleIdentity(roles, isLeader = false) {
  const source = Array.isArray(roles) ? roles : [roles]
  const keys = [...new Set(source.filter(Boolean).map(cqmRoleKey))]
  if (isLeader && !keys.includes('leader')) keys.unshift('leader')

  const hasVoice = keys.includes('voice')
  if (hasVoice && keys.includes('drums')) return { label: 'Batería + voz', phrase: 'ritmo y voz, respeto', color: CQM_ROLE_META.drums.color }
  if (hasVoice && keys.includes('guitar')) return { label: 'Guitarra + voz', phrase: 'acordes y micrófono, imparable', color: CQM_ROLE_META.voice.color }
  if (hasVoice && keys.includes('keys')) return { label: 'Teclados + voz', phrase: 'atmósfera y voz en uno', color: CQM_ROLE_META.keys.color }
  if (hasVoice && (keys.includes('multi') || keys.length > 2)) return { label: 'Multiinstrumentista + voz', phrase: 'one man worship band', color: CQM_ROLE_META.multi.color }
  if (keys.length > 1 && !isLeader) return CQM_ROLE_META.multi
  return CQM_ROLE_META[keys[0]] || CQM_ROLE_META.multi
}

function cqmRoleLabel(role) {
  return CQM_ROLE_META[cqmRoleKey(role)]?.label || String(role || 'Músico')
}

function cqmEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function cqmFormatBytes(bytes) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return ''
  const value = Number(bytes)
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function cqmSafeFileName(name) {
  return String(name || 'archivo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) || 'archivo'
}

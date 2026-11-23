export function getUserDisplayName(user, employeeName = null) {
  const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name
  if (metadataName?.trim()) return metadataName.trim()
  if (employeeName?.trim()) return employeeName.trim()

  const localPart = user?.email?.split('@')[0]?.toLowerCase() ?? ''
  const knownNames = { eklavyanigam: 'Eklavya Nigam' }
  if (knownNames[localPart]) return knownNames[localPart]

  const readableName = localPart
    .split(/[._+-]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
  return readableName || 'HR Admin'
}

export function getUserInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

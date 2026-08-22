export function firestoreLoadHint(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const denied =
    raw.toLowerCase().includes('permission') ||
    raw.toLowerCase().includes('insufficient')

  if (denied) {
    return [
      'Firestore denied the read.',
      'The rules you published are Storage rules (for images), not Firestore.',
      'Open Firebase Console → Firestore Database → Rules and paste the contents of firestore.rules from this project.',
    ].join(' ')
  }

  return raw || 'Check Firestore rules and make sure the database exists.'
}

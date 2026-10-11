/**
 * Field-walk tools (Set pin here, hint/cover photos, verified) show only for
 * admins, and only in development builds or the "field" EAS build profile
 * (EXPO_PUBLIC_FIELD_TOOLS=true). Store builds never show them, and the
 * database rejects their changes from non-admins either way.
 */
export const fieldToolsEnabled = __DEV__ || process.env.EXPO_PUBLIC_FIELD_TOOLS === 'true';

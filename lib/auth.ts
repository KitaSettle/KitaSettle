export {
  fetchAccountHint,
  getAuthCallbackUrl,
  getSession,
  isAuthenticated,
  resetPasswordForEmail,
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  signOut,
  onAuthStateChange,
  updatePassword,
} from "./auth/client";

export {
  getForgotPasswordErrorMessage,
  getLoginErrorMessage,
  getPasswordResetErrorMessage,
} from "./auth/errors";
export type { AccountHint } from "./auth/errors";

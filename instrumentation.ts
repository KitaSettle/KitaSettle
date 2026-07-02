export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getProductionEnvIssues } = await import("@/lib/config/env");
    const issues = getProductionEnvIssues();
    if (issues.length > 0) {
      console.error("[KitaSettle] Production environment issues:", issues.join("; "));
    }
  }
}

export const config = {
  env: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  port: process.env.PORT || 3000,
  integrator: "agentic-arc-prod",   // ganti nama di production
  // dll
};

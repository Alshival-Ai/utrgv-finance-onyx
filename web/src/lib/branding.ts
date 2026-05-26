export const APP_BRAND_NAME = "Finance Agent";
export const APP_BRAND_DESCRIPTION = "Question answering for your documents";
export const APP_BRAND_LOGO_SRC = "/utrgv-logo.png";
export const APP_BRAND_ICON_SRC = "/icon.png";
export const ALSHIVAL_LINK_LABEL = "Alshival.Ai";
export const ALSHIVAL_LINK_URL = "https://alshival.ai";
export const ALSHIVAL_ICON_SRC = "/alshival-ai-icon.png";

export function resolveBrandName(applicationName?: string | null): string {
  return applicationName && applicationName !== "Onyx"
    ? applicationName
    : APP_BRAND_NAME;
}

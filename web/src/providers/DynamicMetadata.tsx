"use client";

import { useEffect, useMemo } from "react";
import { useSettingsContext } from "@/providers/SettingsProvider";
import { APP_BRAND_ICON_SRC, resolveBrandName } from "@/lib/branding";

export default function DynamicMetadata() {
  const { enterpriseSettings } = useSettingsContext();

  useEffect(() => {
    const title = resolveBrandName(enterpriseSettings?.application_name);
    if (document.title !== title) {
      document.title = title;
    }
  }, [enterpriseSettings]);

  // Cache-buster so the favicon re-fetches after an admin uploads a new logo.
  const cacheBuster = useMemo(
    () => Date.now(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enterpriseSettings]
  );

  const favicon = enterpriseSettings?.use_custom_logo
    ? `/api/enterprise-settings/logo?v=${cacheBuster}`
    : APP_BRAND_ICON_SRC;

  return <link rel="icon" href={favicon} />;
}

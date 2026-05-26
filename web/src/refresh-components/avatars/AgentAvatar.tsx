"use client";

import { MinimalAgent } from "@/lib/agents/types";
import { buildAgentAvatarUrl } from "@/lib/agents/utils";
import { useSettingsContext } from "@/providers/SettingsProvider";
import { DEFAULT_AVATAR_SIZE_PX, DEFAULT_AGENT_ID } from "@/lib/constants";
import CustomAgentAvatar from "@/refresh-components/avatars/CustomAgentAvatar";
import Image from "next/image";
import { APP_BRAND_LOGO_SRC, APP_BRAND_NAME } from "@/lib/branding";

export interface AgentAvatarProps {
  agent: MinimalAgent;
  size?: number;
}

export default function AgentAvatar({
  agent,
  size = DEFAULT_AVATAR_SIZE_PX,
  ...props
}: AgentAvatarProps) {
  const settings = useSettingsContext();

  if (agent.id === DEFAULT_AGENT_ID) {
    return settings.enterpriseSettings?.use_custom_logo ? (
      <div
        className="aspect-square rounded-full overflow-hidden relative"
        style={{ height: size, width: size }}
      >
        <Image
          alt="Logo"
          src="/api/enterprise-settings/logo"
          fill
          className="object-cover object-center"
          sizes={`${size}px`}
        />
      </div>
    ) : (
      <Image
        alt={APP_BRAND_NAME}
        src={APP_BRAND_LOGO_SRC}
        width={900}
        height={709}
        className="shrink-0 object-contain"
        style={{ height: size, width: size }}
      />
    );
  }

  return (
    <CustomAgentAvatar
      name={agent.name}
      src={agent.uploaded_image_id ? buildAgentAvatarUrl(agent.id) : undefined}
      iconName={agent.icon_name}
      size={size}
      {...props}
    />
  );
}

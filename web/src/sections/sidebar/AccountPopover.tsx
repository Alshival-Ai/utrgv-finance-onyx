"use client";

import { useState } from "react";
import { LOGOUT_DISABLED } from "@/lib/constants";
import { preload } from "swr";
import { errorHandlingFetcher } from "@/lib/fetcher";
import {
  checkUserIsNoAuthUser,
  getUserDisplayName,
  getUserEmail,
  logout,
} from "@/lib/user";
import { useUser } from "@/providers/UserProvider";
import { Popover, PopoverMenu } from "@opal/components";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SidebarTab, LineItemButton } from "@opal/components";
import {
  SvgExternalLink,
  SvgLogOut,
  SvgSliders,
  SvgUser,
  SvgNotificationBubble,
} from "@opal/icons";
import { Content } from "@opal/layouts";
import { Section } from "@/layouts/general-layouts";
import { toast } from "@/hooks/useToast";
import useAppFocus from "@/hooks/useAppFocus";
import {
  useVectorDbEnabled,
  useSettingsContext,
} from "@/providers/SettingsProvider";
import UserAvatar from "@/refresh-components/avatars/UserAvatar";
import useNotifications from "@/hooks/useNotifications";
import Image from "next/image";
import {
  ALSHIVAL_ICON_SRC,
  ALSHIVAL_LINK_LABEL,
  ALSHIVAL_LINK_URL,
} from "@/lib/branding";

interface SettingsPopoverProps {
  onUserSettingsClick: () => void;
}

function SettingsPopover({ onUserSettingsClick }: SettingsPopoverProps) {
  const { user } = useUser();
  const settings = useSettingsContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAnonymousUser =
    user?.is_anonymous_user || checkUserIsNoAuthUser(user?.id ?? "");
  const showLogout = user && !isAnonymousUser && !LOGOUT_DISABLED;
  const showLogin = isAnonymousUser;

  const handleLogin = () => {
    const currentUrl = `${pathname}${
      searchParams?.toString() ? `?${searchParams.toString()}` : ""
    }`;
    const encodedRedirect = encodeURIComponent(currentUrl);
    router.push(`/auth/login?next=${encodedRedirect}`);
  };

  const handleLogout = () => {
    logout()
      .then((response) => {
        if (!response?.ok) {
          alert("Failed to logout");
          return;
        }

        const currentUrl = `${pathname}${
          searchParams?.toString() ? `?${searchParams.toString()}` : ""
        }`;

        const encodedRedirect = encodeURIComponent(currentUrl);

        router.push(
          `/auth/login?disableAutoRedirect=true&next=${encodedRedirect}`
        );
      })

      .catch(() => {
        toast.error("Failed to logout");
      });
  };

  return (
    <PopoverMenu>
      {[
        <div key="user-email" className="p-2">
          <Content sizePreset="main-ui" title={getUserEmail(user)} />
        </div>,
        null,
        <div key="user-settings" data-testid="Settings/user-settings">
          <LineItemButton
            sizePreset="main-ui"
            variant="section"
            rounding="sm"
            icon={SvgSliders}
            title="Settings"
            href="/app/settings"
            onClick={onUserSettingsClick}
          />
        </div>,
        settings?.enterpriseSettings?.custom_help_link_url && (
          <LineItemButton
            key="custom-help-link"
            sizePreset="main-ui"
            variant="section"
            rounding="sm"
            icon={SvgExternalLink}
            title={
              settings.enterpriseSettings.custom_help_link_label ||
              settings.enterpriseSettings.custom_help_link_url
            }
            href={settings.enterpriseSettings.custom_help_link_url}
            target="_blank"
          />
        ),
        showLogin && (
          <LineItemButton
            key="log-in"
            sizePreset="main-ui"
            variant="section"
            rounding="sm"
            icon={SvgUser}
            title="Log in"
            onClick={handleLogin}
          />
        ),
        showLogout && (
          <LineItemButton
            key="log-out"
            sizePreset="main-ui"
            variant="section"
            color="danger"
            rounding="sm"
            icon={SvgLogOut}
            title="Log Out"
            onClick={handleLogout}
          />
        ),
        null,
        <div key="version" className="p-2">
          <a
            href={ALSHIVAL_LINK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-text-03 hover:text-text-05 transition-colors"
          >
            <Image
              src={ALSHIVAL_ICON_SRC}
              alt=""
              width={24}
              height={26}
              className="h-5 w-5 object-contain"
            />
            <span className="secondaryBody">{ALSHIVAL_LINK_LABEL}</span>
          </a>
        </div>,
      ]}
    </PopoverMenu>
  );
}

export interface SettingsProps {
  folded?: boolean;
  onShowBuildIntro?: () => void;
}

export default function AccountPopover({ folded }: SettingsProps) {
  const [popupState, setPopupState] = useState<"Settings" | undefined>(
    undefined
  );
  const { user } = useUser();
  const appFocus = useAppFocus();
  const vectorDbEnabled = useVectorDbEnabled();
  const { undismissedCount } = useNotifications();
  const userDisplayName = getUserDisplayName(user);

  const handlePopoverOpen = (state: boolean) => {
    if (state) {
      // Prefetch user settings data when popover opens for instant modal display
      preload("/api/user/pats", errorHandlingFetcher);
      preload("/api/federated/oauth-status", errorHandlingFetcher);
      if (vectorDbEnabled) {
        preload("/api/manage/connector-status", errorHandlingFetcher);
      }
      preload("/api/llm/provider", errorHandlingFetcher);
      setPopupState("Settings");
    } else {
      setPopupState(undefined);
    }
  };

  return (
    <Popover open={!!popupState} onOpenChange={handlePopoverOpen}>
      <Popover.Trigger asChild>
        <div id="onyx-user-dropdown">
          <SidebarTab
            icon={(props) => (
              <div className="w-[16px] flex flex-col justify-center items-center">
                <UserAvatar user={user} {...props} size={props.size} />
              </div>
            )}
            rightChildren={
              undismissedCount ? (
                <Section padding={0.5}>
                  <SvgNotificationBubble count={undismissedCount} />
                </Section>
              ) : undefined
            }
            type="button"
            selected={!!popupState || appFocus.isUserSettings()}
            folded={folded}
          >
            {userDisplayName}
          </SidebarTab>
        </div>
      </Popover.Trigger>

      <Popover.Content align="end" side="right" width="lg">
        {popupState === "Settings" && (
          <SettingsPopover
            onUserSettingsClick={() => {
              setPopupState(undefined);
            }}
          />
        )}
      </Popover.Content>
    </Popover>
  );
}

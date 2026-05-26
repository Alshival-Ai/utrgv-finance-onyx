import Link from "next/link";
import Image from "next/image";
import { APP_BRAND_LOGO_SRC, APP_BRAND_NAME } from "@/lib/branding";

export default function AuthFlowContainer({
  children,
  authState,
  footerContent,
}: {
  children: React.ReactNode;
  authState?: "signup" | "login" | "join";
  footerContent?: React.ReactNode;
}) {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-[var(--utrgv-navy,var(--background-neutral-00))]">
      <div className="w-full max-w-md flex items-start flex-col overflow-hidden bg-background-tint-00 rounded-16 shadow-lg shadow-03 border border-border-02">
        <div className="h-1.5 w-full flex">
          <div className="flex-1 bg-[#FFA300]" />
          <div className="flex-1 bg-[#F05023]" />
          <div className="flex-1 bg-[#00843D]" />
        </div>
        <div className="w-full p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-8 bg-white shadow-sm shadow-02">
              <Image
                src={APP_BRAND_LOGO_SRC}
                alt={APP_BRAND_NAME}
                width={900}
                height={709}
                className="h-11 w-12 object-contain"
                priority
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="mainUiAction text-text-05">
                {APP_BRAND_NAME}
              </span>
            </div>
          </div>
          <div className="w-full mt-5">{children}</div>
        </div>
      </div>
      {authState === "login" && (
        <div className="text-sm mt-6 text-center w-full text-white/70 mainUiBody mx-auto">
          {footerContent ?? (
            <>
              New here?{" "}
              <Link
                href="/auth/signup"
                className="text-white mainUiAction underline transition-colors duration-200"
              >
                Create an Account
              </Link>
            </>
          )}
        </div>
      )}
      {authState === "signup" && (
        <div className="text-sm mt-6 text-center w-full text-white/70 mainUiBody mx-auto">
          Already have an account?{" "}
          <Link
            href="/auth/login?autoRedirectToSignup=false"
            className="text-white mainUiAction underline transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

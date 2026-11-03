"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { errorTextClass, primaryButtonClass } from "@/lib/styles";

export default function GoogleSignInButton() {
  const t = useTranslations("welcome");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signIn() {
    setLoading(true);
    setFailed(false);

    const supabase = createClient();

    // On success the browser navigates to Google, so loading stays true.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setFailed(true);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className={primaryButtonClass}
      >
        {loading ? t("redirecting") : t("continueWithGoogle")}
      </button>

      {failed && (
        <p role="alert" className={errorTextClass}>
          {t("oauthError")}
        </p>
      )}
    </div>
  );
}

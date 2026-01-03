import { useEffect, useState } from "react";
import { SettingsView } from "../components/SettingsView";
import { uploadCookbookCover } from "../lib/supabaseStorage";

export const SettingsRoute = ({
  status,
  inviteUrl,
  groupCode,
  createNewGroup,
  joinGroup,
  addToast,
  setRecipes,
  setCookbooks,
  setCuisines,
  setLogs,
  cookbookCoverTargets,
  cookbookCoverMap,
}) => {
  const [showInvite, setShowInvite] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone;
      setIsInstalled(Boolean(isStandalone));
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      addToast("Cookbook Keeper is installed.", "success");
    };

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => checkInstalled();
    if (displayModeQuery.addEventListener) {
      displayModeQuery.addEventListener("change", handleDisplayModeChange);
    } else {
      displayModeQuery.addListener(handleDisplayModeChange);
    }

    checkInstalled();
    setIsIosDevice(
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
        !window.MSStream
    );

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (displayModeQuery.removeEventListener) {
        displayModeQuery.removeEventListener("change", handleDisplayModeChange);
      } else {
        displayModeQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, [addToast]);

  const handleInstallApp = async () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    const outcome = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome?.outcome === "accepted") {
      addToast("Install request sent to your device.", "success");
    } else {
      addToast("Install dismissed.", "info");
    }
  };

  const buildInviteUrl = (code) => {
    if (!code || typeof window === "undefined") {
      return "";
    }
    const baseUrl = new URL(
      import.meta.env.BASE_URL || "/",
      window.location.origin
    );
    baseUrl.searchParams.set("invite", code);
    return baseUrl.toString();
  };

  const handleGenerateInvite = async () => {
    setShowInvite(true);
    let nextInvite = inviteUrl;
    if (!groupCode) {
      const newCode = await createNewGroup({
        name: "Shared kitchen",
        duplicate: true,
      });
      nextInvite = buildInviteUrl(newCode);
    }
    if (nextInvite && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(nextInvite);
      addToast("Invite link copied.", "success");
    }
  };

  const handleCopyGroupCode = async () => {
    if (!groupCode || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(groupCode);
    addToast("Group code copied.", "success");
  };

  const handleJoinGroup = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    const codeMatch = trimmed.match(/invite=([^&]+)/i);
    const code = codeMatch ? decodeURIComponent(codeMatch[1]) : trimmed;
    const joined = joinGroup(code);
    if (joined) {
      addToast("Joined group successfully.", "success");
    }
    return joined;
  };

  const handleClearData = () => {
    const confirmed = window.confirm(
      "Delete all recipes, logs, and saved settings? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }
    setRecipes([]);
    setCookbooks([]);
    setCuisines([]);
    setLogs([]);
  };

  const handleUploadCookbookCover = async (title, file) => {
    if (!groupCode) {
      addToast("Join a group before uploading artwork.", "error");
      return { ok: false, error: "No group selected." };
    }

    const { data, error } = await uploadCookbookCover({
      title,
      groupCode,
      file,
    });

    if (error) {
      addToast("Artwork upload failed. Please try again.", "error");
      return { ok: false, error: error.message || "Upload failed." };
    }

    setCookbooks((prev) => {
      const normalized = (Array.isArray(prev) ? prev : [])
        .map((entry) => {
          if (!entry) {
            return null;
          }
          if (typeof entry === "string") {
            return { title: entry, coverUrl: "" };
          }
          if (typeof entry === "object") {
            return {
              title: entry.title || "",
              coverUrl: entry.coverUrl || "",
            };
          }
          return null;
        })
        .filter((entry) => entry?.title);
      const next = cookbookCoverTargets.map((cookbookTitle) => {
        const existing = normalized.find(
          (entry) => entry.title === cookbookTitle
        );
        if (existing) {
          if (existing.title === title) {
            return { ...existing, coverUrl: data.publicUrl };
          }
          return existing;
        }
        return {
          title: cookbookTitle,
          coverUrl: cookbookTitle === title ? data.publicUrl : "",
        };
      });
      const isSame =
        normalized.length === next.length &&
        normalized.every(
          (entry, index) =>
            entry.title === next[index].title &&
            (entry.coverUrl || "") === (next[index].coverUrl || "")
        );
      return isSame ? prev : next;
    });
    addToast(`Updated artwork for ${title}.`, "success");
    return { ok: true, url: data.publicUrl };
  };

  return (
    <SettingsView
      onGenerateInvite={handleGenerateInvite}
      onClearData={handleClearData}
      onJoinGroup={handleJoinGroup}
      onCopyGroupCode={handleCopyGroupCode}
      onInstallApp={handleInstallApp}
      cookbookOptions={cookbookCoverTargets}
      cookbookCovers={cookbookCoverMap}
      onUploadCookbookCover={handleUploadCookbookCover}
      inviteUrl={showInvite ? inviteUrl : ""}
      groupCode={groupCode}
      statusMessage={status.state === "error" ? status.message : ""}
      hasGroup={Boolean(groupCode)}
      canInstallApp={Boolean(installPrompt) && !isInstalled}
      isInstalled={isInstalled}
      isIosDevice={isIosDevice}
    />
  );
};

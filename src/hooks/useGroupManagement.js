import { useEffect, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage.js";

export const useGroupManagement = () => {
  const [groupCode, setGroupCode] = useLocalStorage("recipe-group-code", "");

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !groupCode) {
      return "";
    }
    const baseUrl = new URL(
      import.meta.env?.BASE_URL || "/",
      window.location.origin
    );
    baseUrl.searchParams.set("invite", groupCode);
    return baseUrl.toString();
  }, [groupCode]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location) {
      return;
    }
    const inviteCode = new URLSearchParams(window.location.search).get("invite");
    if (inviteCode && inviteCode !== groupCode) {
      setGroupCode(inviteCode);
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState({}, "", url);
    }
  }, [groupCode, setGroupCode]);

  return {
    groupCode,
    setGroupCode,
    inviteUrl,
  };
};

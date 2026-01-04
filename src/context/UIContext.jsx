import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createId } from "../utils/idUtils.js";

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRecipeId, setPreviewRecipeId] = useState(null);

  const addToast = useCallback((message, variant = "info") => {
    const id = createId();
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      isLogModalOpen,
      setIsLogModalOpen,
      isRecipeModalOpen,
      setIsRecipeModalOpen,
      isPreviewOpen,
      setIsPreviewOpen,
      previewRecipeId,
      setPreviewRecipeId,
    }),
    [
      toasts,
      addToast,
      isLogModalOpen,
      isRecipeModalOpen,
      isPreviewOpen,
      previewRecipeId,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

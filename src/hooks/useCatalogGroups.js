import { useCallback } from "react";
import { createCatalog } from "../lib/catalogService.js";

const generateGroupCode = () =>
  `group-${crypto.randomUUID().split("-")[0]}`.toLowerCase();

export const useCatalogGroups = ({
  catalog,
  defaultCatalog,
  setCatalog,
  setCatalogId,
  setGroupCode,
  setStatus,
  statusMessages,
}) => {
  const createNewGroup = useCallback(
    async ({ name, duplicate }) => {
      const newCode = generateGroupCode();
      const dataPayload = duplicate ? catalog : defaultCatalog;
      const { data, error } = await createCatalog({
        groupCode: newCode,
        groupName: name || "Shared kitchen",
        data: dataPayload,
      });

      if (error) {
        setStatus({ state: "error", message: statusMessages.error });
        return null;
      }

      setGroupCode(newCode);
      setCatalogId(data.id);
      setCatalog(data.data || defaultCatalog);
      return newCode;
    },
    [
      catalog,
      defaultCatalog,
      setCatalog,
      setCatalogId,
      setGroupCode,
      setStatus,
      statusMessages,
    ]
  );

  const joinGroup = useCallback(
    (code) => {
      const trimmed = code.trim();
      if (!trimmed) {
        return false;
      }
      setGroupCode(trimmed);
      setCatalogId(null);
      setCatalog(defaultCatalog);
      return true;
    },
    [defaultCatalog, setCatalog, setCatalogId, setGroupCode]
  );

  return { createNewGroup, joinGroup };
};

import { useCallback } from "react";
import { createId } from "../utils/idUtils.js";
import {
  createCatalogGroup,
  upsertCatalogData,
} from "../lib/catalogService.js";

const generateGroupCode = () =>
  `group-${createId().split("-")[0]}`.toLowerCase();

export const useCatalogGroups = ({
  catalog,
  defaultCatalog,
  setCatalog,
  setGroupId,
  setGroupCode,
  setStatus,
  statusMessages,
}) => {
  const createNewGroup = useCallback(
    async ({ name, duplicate }) => {
      const newCode = generateGroupCode();
      const dataPayload = duplicate ? catalog : defaultCatalog;
      const { data, error } = await createCatalogGroup({
        groupCode: newCode,
        groupName: name || "Shared kitchen",
      });

      if (error) {
        setStatus({ state: "error", message: statusMessages.error });
        return null;
      }

      const { error: seedError } = await upsertCatalogData({
        groupId: data.id,
        data: dataPayload,
      });
      if (seedError) {
        setStatus({ state: "error", message: statusMessages.error });
        return null;
      }

      setGroupCode(newCode);
      setGroupId(data.id);
      setCatalog(dataPayload || defaultCatalog);
      return newCode;
    },
    [
      catalog,
      defaultCatalog,
      setCatalog,
      setGroupId,
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
      setGroupId(null);
      setCatalog(defaultCatalog);
      return true;
    },
    [defaultCatalog, setCatalog, setGroupCode, setGroupId]
  );

  return { createNewGroup, joinGroup };
};

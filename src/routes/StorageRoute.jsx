import { StorageView } from "../components/StorageView";

export const StorageRoute = ({
  storageByLocation,
  onOpenModal,
  onUpdatePortionsLeft,
}) => {
  return (
    <StorageView
      storageByLocation={storageByLocation}
      onOpenModal={onOpenModal}
      onUpdatePortionsLeft={onUpdatePortionsLeft}
    />
  );
};

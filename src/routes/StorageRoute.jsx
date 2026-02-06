import { StorageView } from "../components/StorageView";

export const StorageRoute = ({
  storageByLocation,
  onOpenModal,
  onUpdatePortionsLeft,
  onScheduleItem,
}) => {
  return (
    <StorageView
      storageByLocation={storageByLocation}
      onOpenModal={onOpenModal}
      onUpdatePortionsLeft={onUpdatePortionsLeft}
      onScheduleItem={onScheduleItem}
    />
  );
};

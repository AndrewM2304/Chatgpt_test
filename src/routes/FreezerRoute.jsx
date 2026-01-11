import { FreezerView } from "../components/FreezerView";

export const FreezerRoute = ({
  storageByLocation,
  onOpenModal,
  onUpdatePortionsLeft,
}) => {
  return (
    <FreezerView
      storageByLocation={storageByLocation}
      onOpenModal={onOpenModal}
      onUpdatePortionsLeft={onUpdatePortionsLeft}
    />
  );
};

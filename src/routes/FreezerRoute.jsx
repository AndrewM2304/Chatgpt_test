import { FreezerView } from "../components/FreezerView";

export const FreezerRoute = ({ items, onOpenModal, onUpdatePortionsLeft }) => {
  return (
    <FreezerView
      items={items}
      onOpenModal={onOpenModal}
      onUpdatePortionsLeft={onUpdatePortionsLeft}
    />
  );
};

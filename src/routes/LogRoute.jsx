import { LogView } from "../components/LogView";

export const LogRoute = ({
  logWeekDate,
  onLogWeekDate,
  weekDays,
  weeklySchedule,
  mealOptions,
  onOpenLogModal,
}) => {
  return (
    <LogView
      logWeekDate={logWeekDate}
      onLogWeekDate={onLogWeekDate}
      weekDays={weekDays}
      weeklySchedule={weeklySchedule}
      mealOptions={mealOptions}
      onOpenLogModal={onOpenLogModal}
    />
  );
};

export const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getWeekdayIndex = (date) => (date.getDay() + 6) % 7;

export const getWeekStart = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  const offset = getWeekdayIndex(date);
  const start = new Date(date);
  start.setDate(date.getDate() - offset);
  return start;
};

export const StatusBanner = ({ status }) => {
  if (!status?.message) {
    return null;
  }

  return (
    <div className={`status-banner is-${status.state}`}>
      <span>{status.message}</span>
    </div>
  );
};

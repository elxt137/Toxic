export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="announcement-bar" aria-label="Información comercial">
      <div className="announcement-track">
        <span>{text}</span><span aria-hidden="true">{text}</span><span aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}

export default function Romanisation({ value }) {
  if (!value) return null;

  const parts = String(value).split(/(\d+)/);

  return (
    <>
      {parts.map((part, index) =>
        /^\d+$/.test(part) ? <sup key={index}>{part}</sup> : part,
      )}
    </>
  );
}

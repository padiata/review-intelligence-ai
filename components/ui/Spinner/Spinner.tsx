import "./Spinner.css";

type Props = {
  size?: "sm" | "md" | "lg";
  label?: string;
};

export default function Spinner({
  size = "md",
  label,
}: Props) {
  return (
    <div className="ri-spinner-container">

      <div
        className={`ri-spinner ri-spinner-${size}`}
      />

      {label && (
        <span className="ri-spinner-label">
          {label}
        </span>
      )}

    </div>
  );
}
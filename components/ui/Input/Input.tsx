import "./Input.css";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({
  label,
  error,
  className = "",
  ...props
}: Props) {
  return (
    <div className="ri-input-wrapper">

      {label && (
        <label className="ri-input-label">
          {label}
        </label>
      )}

      <input
        {...props}
        className={`ri-input ${className}`}
      />

      {error && (
        <span className="ri-input-error">
          {error}
        </span>
      )}

    </div>
  );
}
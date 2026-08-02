import "./Textarea.css";

type Props =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
    helperText?: string;
  };

export default function Textarea({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: Props) {
  const textareaId =
    id ??
    `textarea-${label
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`;

  return (
    <div className="ri-textarea-wrapper">
      {label && (
        <label
          className="ri-textarea-label"
          htmlFor={textareaId}
        >
          {label}
        </label>
      )}

      <textarea
        {...props}
        id={textareaId}
        className={[
          "ri-textarea",
          error ? "ri-textarea-invalid" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? `${textareaId}-error`
            : helperText
              ? `${textareaId}-helper`
              : undefined
        }
      />

      {error ? (
        <span
          id={`${textareaId}-error`}
          className="ri-textarea-error"
        >
          {error}
        </span>
      ) : (
        helperText && (
          <span
            id={`${textareaId}-helper`}
            className="ri-textarea-helper"
          >
            {helperText}
          </span>
        )
      )}
    </div>
  );
}
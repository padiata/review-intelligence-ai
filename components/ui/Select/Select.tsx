import "./Select.css";

type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type Props = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  label?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
};

export default function Select({
  label,
  error,
  placeholder,
  options,
  className = "",
  id,
  ...props
}: Props) {
  const selectId =
    id ??
    `select-${label
      ?.toLowerCase()
      .replace(/\s+/g, "-")}`;

  return (
    <div className="ri-select-wrapper">
      {label && (
        <label
          className="ri-select-label"
          htmlFor={selectId}
        >
          {label}
        </label>
      )}

      <select
        {...props}
        id={selectId}
        className={[
          "ri-select",
          error ? "ri-select-invalid" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? `${selectId}-error`
            : undefined
        }
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={String(option.value)}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <span
          id={`${selectId}-error`}
          className="ri-select-error"
        >
          {error}
        </span>
      )}
    </div>
  );
}
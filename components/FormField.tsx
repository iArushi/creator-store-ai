import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
};

type InputFieldProps = BaseProps & {
  as?: "input";
} & InputHTMLAttributes<HTMLInputElement>;

type TextareaFieldProps = BaseProps & {
  as: "textarea";
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

type FormFieldProps = InputFieldProps | TextareaFieldProps;

export default function FormField(props: FormFieldProps) {
  const { id, label, error, required, as = "input", className, ...rest } =
    props;

  const controlClass = [
    "sp-field__control",
    error ? "sp-field__control--error" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`sp-field${as === "textarea" ? " sp-field--textarea" : ""}`}
    >
      {as === "textarea" ? (
        <textarea
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      <label htmlFor={id} className="sp-field__label">
        {label}
      </label>

      {error ? (
        <p id={`${id}-error`} role="alert" className="sp-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

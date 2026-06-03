import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit?: (text: string) => Promise<void>;
}

export function GuessForm({ disabled = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit(guessText);
      setGuessText("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={disabled || submitting}
        />
      </label>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || submitting || guessText.trim().length === 0}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}

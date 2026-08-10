/**
 * React resets uncontrolled <form> fields whenever a form action's promise
 * resolves — including when the action catches an error and returns
 * `{ success: false, error }` instead of throwing. Call this in the error
 * branch of the action-result effect to put the user's input back.
 */
export function restoreFormValues(
  form: HTMLFormElement | null,
  data: FormData | null,
): void {
  if (!form || !data) return;

  for (const [name, value] of data.entries()) {
    if (typeof value !== 'string') continue; // file inputs can't be restored

    const field = form.elements.namedItem(name);
    if (field && 'value' in field) {
      (field as unknown as { value: string }).value = value;
    }
  }
}

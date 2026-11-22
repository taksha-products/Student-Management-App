/**
 * App-wide branded dialog (replaces the system Alert).
 *
 * Call `showDialog(...)` from anywhere — screens, contexts, plain functions.
 * `<DialogHost />` (mounted once in the root layout) renders it.
 */
export type DialogTone = "info" | "success" | "error" | "warning";

export interface DialogAction {
  label: string;
  onPress?: () => void;
  /** primary = filled brand button (default for the last action), secondary = grey. */
  style?: "primary" | "secondary" | "destructive";
}

export interface DialogOptions {
  title: string;
  message?: string;
  tone?: DialogTone;
  actions?: DialogAction[];
}

type Listener = (options: DialogOptions) => void;

let listener: Listener | null = null;
const queue: DialogOptions[] = [];

/** Used by DialogHost to receive dialogs (flushes any shown before it mounted). */
export const registerDialogHost = (next: Listener | null): void => {
  listener = next;
  if (next) {
    while (queue.length) {
      next(queue.shift() as DialogOptions);
    }
  }
};

export const showDialog = (options: DialogOptions): void => {
  if (listener) {
    listener(options);
  } else {
    queue.push(options);
  }
};

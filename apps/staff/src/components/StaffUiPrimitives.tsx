import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, ClipboardList, X } from "lucide-react";
import type { StaffUser } from "../../../../packages/staff-contracts/types";
import { isNetworkOfflineError } from "../../../../packages/staff-contracts/offline-cache.mjs";
import type { Translate } from "../staffConfig";

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <span>
        <ClipboardList size={23} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function Modal({
  title,
  children,
  close,
  t,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  t: Translate;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement);
  useEffect(() => {
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      opener.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button className="icon-button" aria-label={t("Close")} onClick={close}>
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

export function useSubmission(
  done: () => Promise<void> | void,
  onOfflineFallback?: (err: unknown, key: string) => boolean,
) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef({ body: "", key: crypto.randomUUID() });
  const submit = async (
    body: unknown,
    operation: (key: string) => Promise<unknown>,
  ) => {
    if (busy) return;
    const serialized = JSON.stringify(body);
    if (key.current.body !== serialized)
      key.current = { body: serialized, key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.onLine === false &&
        onOfflineFallback
      ) {
        if (onOfflineFallback(new Error("You are offline."), key.current.key)) {
          return;
        }
      }
      await operation(key.current.key);
      await done();
    } catch (e) {
      if (isNetworkOfflineError(e) && onOfflineFallback) {
        if (onOfflineFallback(e, key.current.key)) {
          return;
        }
      }
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id: string }>, {
            id,
          })
        : children}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return message ? (
    <p className="form-error" role="alert">
      <AlertCircle size={16} />
      {message}
    </p>
  ) : null;
}

export function Agents({
  users,
  self,
  t,
}: {
  users: StaffUser[];
  self: StaffUser;
  t: Translate;
}) {
  return (
    <Field label={t("Next agent")}>
      <select name="nextAssigneeId" defaultValue={self.id} required>
        {[self, ...users.filter((u) => u.id !== self.id)]
          .filter(
            (u) =>
              u.id === self.id ||
              (self.role === "callcenter"
                ? u.role === "sales"
                : self.role === "ceo"
                  ? u.role === "callcenter" ||
                    u.role === "sales" ||
                    u.role === "sales_leader"
                  : u.role === "callcenter" || u.role === "sales"),
          )
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.id === self.id ? t("Follow up myself") : u.name}
            </option>
          ))}
      </select>
    </Field>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../../components/Modal";
import type { SessionInput, StudySession, Subject } from "../../types/domain";
import { todayIso } from "../../utils/dates";
import { sessionSchema, toSessionInput, type SessionFormValues } from "./sessionSchema";

interface SessionFormDialogProps {
  open: boolean;
  session: StudySession | null;
  subjects: Subject[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: SessionInput) => Promise<void>;
}

export function SessionFormDialog({
  open,
  session,
  subjects,
  saving,
  onClose,
  onSubmit,
}: SessionFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: blankValues(subjects),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      session
        ? {
            subjectId: session.subjectId,
            studyDate: session.studyDate,
            hours: String(Math.floor(session.durationMinutes / 60)),
            minutes: String(session.durationMinutes % 60),
            notes: session.notes,
          }
        : blankValues(subjects),
    );
  }, [open, session, subjects, reset]);

  return (
    <Modal open={open} title={session ? "Edit study session" : "Log study session"} onClose={onClose}>
      <form onSubmit={handleSubmit(async (values) => onSubmit(toSessionInput(values)))} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="session-subject">
            Subject
          </label>
          <select
            id="session-subject"
            className="select"
            aria-invalid={Boolean(errors.subjectId)}
            {...register("subjectId")}
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId ? <span className="field__error">{errors.subjectId.message}</span> : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="session-date">
            Date
          </label>
          <input
            id="session-date"
            type="date"
            className="input"
            max={todayIso()}
            aria-invalid={Boolean(errors.studyDate)}
            {...register("studyDate")}
          />
          {errors.studyDate ? <span className="field__error">{errors.studyDate.message}</span> : null}
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="session-hours">
              Hours
            </label>
            <input
              id="session-hours"
              className="input"
              inputMode="numeric"
              placeholder="0"
              aria-invalid={Boolean(errors.hours)}
              {...register("hours")}
            />
            {errors.hours ? <span className="field__error">{errors.hours.message}</span> : null}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="session-minutes">
              Minutes
            </label>
            <input
              id="session-minutes"
              className="input"
              inputMode="numeric"
              placeholder="30"
              aria-invalid={Boolean(errors.minutes)}
              {...register("minutes")}
            />
            {errors.minutes ? <span className="field__error">{errors.minutes.message}</span> : null}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="session-notes">
            Notes
          </label>
          <textarea
            id="session-notes"
            className="textarea"
            placeholder="What did you study?"
            aria-invalid={Boolean(errors.notes)}
            {...register("notes")}
          />
          {errors.notes ? <span className="field__error">{errors.notes.message}</span> : null}
        </div>

        <div className="modal__footer">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Saving…" : "Save session"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function blankValues(subjects: Subject[]): SessionFormValues {
  return {
    subjectId: subjects.length === 1 ? subjects[0].id : "",
    studyDate: todayIso(),
    hours: "",
    minutes: "",
    notes: "",
  };
}

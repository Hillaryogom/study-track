import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "../../components/Modal";
import { SUBJECT_COLOURS, type Subject, type SubjectInput } from "../../types/domain";
import { subjectSchema, toSubjectInput, type SubjectFormValues } from "./subjectSchema";

interface SubjectFormDialogProps {
  open: boolean;
  subject: Subject | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: SubjectInput) => Promise<void>;
}

const BLANK: SubjectFormValues = {
  name: "",
  colour: SUBJECT_COLOURS[0].value,
  targetHours: "",
  description: "",
};

export function SubjectFormDialog({ open, subject, saving, onClose, onSubmit }: SubjectFormDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({ resolver: zodResolver(subjectSchema), defaultValues: BLANK });

  useEffect(() => {
    if (!open) return;
    reset(
      subject
        ? {
            name: subject.name,
            colour: subject.colour,
            targetHours: subject.targetHours ? String(subject.targetHours) : "",
            description: subject.description,
          }
        : BLANK,
    );
  }, [open, subject, reset]);

  async function submit(values: SubjectFormValues) {
    await onSubmit(toSubjectInput(values));
  }

  return (
    <Modal open={open} title={subject ? "Edit subject" : "Add subject"} onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="subject-name">
            Subject name
          </label>
          <input
            id="subject-name"
            className="input"
            placeholder="e.g. Database Systems"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? <span className="field__error">{errors.name.message}</span> : null}
        </div>

        <Controller
          control={control}
          name="colour"
          render={({ field }) => (
            <fieldset className="field">
              <legend className="field__label">Colour</legend>
              <div className="colour-choices">
                {SUBJECT_COLOURS.map((colour) => (
                  <button
                    key={colour.value}
                    type="button"
                    className="colour-choice"
                    style={{ background: colour.value }}
                    aria-label={colour.label}
                    aria-pressed={field.value === colour.value}
                    onClick={() => field.onChange(colour.value)}
                  />
                ))}
              </div>
            </fieldset>
          )}
        />

        <div className="field">
          <label className="field__label" htmlFor="subject-target">
            Target study hours
          </label>
          <input
            id="subject-target"
            className="input"
            inputMode="numeric"
            placeholder="e.g. 30"
            aria-invalid={Boolean(errors.targetHours)}
            {...register("targetHours")}
          />
          <span className="field__hint">Optional. Used to work out your progress percentage.</span>
          {errors.targetHours ? <span className="field__error">{errors.targetHours.message}</span> : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="subject-description">
            Description
          </label>
          <textarea
            id="subject-description"
            className="textarea"
            placeholder="Add a short description…"
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
          {errors.description ? <span className="field__error">{errors.description.message}</span> : null}
        </div>

        <div className="modal__footer">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Saving…" : "Save subject"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

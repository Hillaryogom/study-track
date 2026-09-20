import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/ToastProvider";
import { useStudyData, toSafeMessage } from "../../state/StudyDataProvider";
import type { Subject, SubjectInput } from "../../types/domain";
import { sessionsForSubject } from "../../utils/analytics";
import { SubjectCard } from "./SubjectCard";
import { SubjectFormDialog } from "./SubjectFormDialog";

export function SubjectsPage() {
  const { subjects, sessions, goals, loading, saving, createSubject, updateSubject, deleteSubject } =
    useStudyData();
  const { notify, notifyError } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Subject | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(subject: Subject) {
    setEditing(subject);
    setFormOpen(true);
  }

  async function handleSubmit(input: SubjectInput) {
    try {
      if (editing) {
        await updateSubject(editing.id, input);
        notify("Subject updated", `"${input.name}" has been updated.`);
      } else {
        await createSubject(input);
        notify("Subject added", `"${input.name}" has been added to your subjects.`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError("Subject not saved", toSafeMessage(error));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteSubject(pendingDelete.id);
      notify("Subject deleted", `"${pendingDelete.name}" and its sessions were removed.`);
      setPendingDelete(null);
    } catch (error) {
      notifyError("Subject not deleted", toSafeMessage(error));
    }
  }

  if (loading) return <LoadingScreen label="Loading your subjects" />;

  const dependentSessions = pendingDelete ? sessionsForSubject(pendingDelete.id, sessions).length : 0;
  const dependentGoals = pendingDelete
    ? goals.filter((goal) => goal.subjectId === pendingDelete.id).length
    : 0;

  return (
    <div className="page">
      <PageHeader
        title="My Subjects"
        description="Manage your subjects and track your progress against the hours you planned."
        action={
          <button type="button" className="button button--primary" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" />
            Add subject
          </button>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="No subjects yet"
          description="Add the modules you are studying this semester. Every study session you log belongs to one of them."
          action={
            <button type="button" className="button button--primary" onClick={openCreate}>
              Add your first subject
            </button>
          }
        />
      ) : (
        <div className="subject-grid">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              sessions={sessions}
              onEdit={openEdit}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <SubjectFormDialog
        open={formOpen}
        subject={editing}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "subject"}?`}
        message={
          dependentSessions + dependentGoals > 0
            ? `This also deletes ${dependentSessions} study session${dependentSessions === 1 ? "" : "s"} and ${dependentGoals} goal${dependentGoals === 1 ? "" : "s"} linked to this subject. This cannot be undone.`
            : "This subject has no sessions yet. Deleting it cannot be undone."
        }
        confirmLabel="Delete subject"
        pending={saving}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

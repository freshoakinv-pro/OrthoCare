import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PromQuestionnaire() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const sch = trpc.proms.getScheduleById.useQuery({ id: scheduleId! }, { enabled: !!scheduleId });
  const qs = trpc.proms.getQuestions.useQuery(
    { promTypeId: sch.data?.promTypeId ?? 0 },
    { enabled: !!sch.data?.promTypeId },
  );
  const submit = trpc.proms.submit.useMutation();

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const list = qs.data ?? [];
  const q = list[idx];
  const progress = list.length ? ((idx + 1) / list.length) * 100 : 0;

  const responsesPayload = useMemo(
    () =>
      Object.entries(answers).map(([questionId, responseValue]) => ({
        questionId: Number(questionId),
        responseValue,
      })),
    [answers],
  );

  if (sch.isLoading || !scheduleId) return <Skeleton height={300} />;
  if (!sch.data) return <p>Not found</p>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 12px" }}>
      <div
        style={{
          height: 8,
          background: "var(--stone)",
          borderRadius: 999,
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--moss)" }} />
      </div>
      <p style={{ fontSize: "0.875rem", color: "var(--bark)" }}>
        Question {idx + 1} of {list.length || "…"}
      </p>
      {q ? (
        <>
          <h2 style={{ fontSize: "1.25rem", marginBottom: 16 }}>{q.questionText}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {q.responseOptions.map((opt) => {
              const selected = answers[q.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                  className="oc-focus-ring"
                  style={{
                    minHeight: 48,
                    padding: "14px 16px",
                    textAlign: "left",
                    borderRadius: 8,
                    border: selected ? "2px solid var(--moss)" : "1px solid var(--bark)",
                    background: selected ? "rgba(92,107,90,0.08)" : "var(--linen)",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui)",
                    fontSize: "1rem",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <Skeleton height={200} />
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          Previous
        </Button>
        {idx < list.length - 1 ? (
          <Button onClick={() => setIdx((i) => i + 1)} disabled={!q || !answers[q.id]}>
            Next
          </Button>
        ) : (
          <Button
            onClick={async () => {
              if (!sch.data) return;
              await submit.mutateAsync({
                patientId: sch.data.patientId,
                promTypeId: sch.data.promTypeId,
                episodeId: sch.data.episodeId,
                responses: responsesPayload,
                completedBy: "PATIENT",
                completionMethod: "WEB",
              });
            }}
            disabled={list.some((qq) => !answers[qq.id]) || submit.isPending}
          >
            Submit & See Results
          </Button>
        )}
      </div>
      {submit.data ? (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <h3>Your score</h3>
          <div style={{ fontSize: "2.5rem", fontFamily: "var(--font-mono)" }}>{submit.data.totalScore}</div>
          <Badge interpretation={submit.data.interpretation}>{submit.data.interpretation}</Badge>
          <p style={{ color: "var(--bark)", marginTop: 16 }}>
            Your score reflects how you&apos;re doing — keep going with your exercises and follow-ups.
          </p>
          <Button style={{ marginTop: 16 }} variant="ghost" onClick={() => navigate("/patient/pending-proms")}>
            Back to list
          </Button>
        </div>
      ) : null}
    </div>
  );
}

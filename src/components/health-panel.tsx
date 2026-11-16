import { HealthBadge } from "@/components/health-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthEntry, HealthPanel as Panel } from "@/lib/health-panel";

function EntryCard({ entry, heading }: { entry: HealthEntry; heading: string }) {
  const { health } = entry;
  return (
    <Card>
      <CardHeader>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{heading}</p>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{entry.name}</span>
          <HealthBadge color={health.color} label={health.label} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {health.reasons.length === 0 ? (
          <p>{health.summary}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {health.reasons.map((reason) => (
              <li key={reason.text} className="flex flex-col gap-1">
                <span>{reason.text}</span>
                {reason.itemIds.length > 0 && (
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {reason.itemIds.map((itemId) => (
                      <a key={itemId} href={`#item-${itemId}`} className="underline underline-offset-2">
                        {entry.itemTitles[itemId] ?? "Ver item"}
                      </a>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function HealthPanel({ panel }: { panel: Panel }) {
  return (
    <section className="flex flex-col gap-3" aria-label="Saúde do projeto">
      <h2 className="text-lg font-semibold">Saúde do projeto</h2>
      <EntryCard entry={panel.project} heading="Projeto" />
      {panel.epics.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Por épico</h3>
          {panel.epics.map((epic) => (
            <EntryCard key={epic.id} entry={epic} heading="Épico" />
          ))}
        </div>
      )}
      {panel.areas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Por área</h3>
          {panel.areas.map((area) => (
            <EntryCard key={area.id} entry={area} heading="Área" />
          ))}
        </div>
      )}
    </section>
  );
}

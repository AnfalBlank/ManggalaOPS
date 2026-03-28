import { AlertCircle, DatabaseZap } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <DatabaseZap className="size-5" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ErrorState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
        <AlertCircle className="size-5" />
      </div>
      <h3 className="text-lg font-semibold text-rose-700">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-rose-600">{description}</p>
    </div>
  );
}

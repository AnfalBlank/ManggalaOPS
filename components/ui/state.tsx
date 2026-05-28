import { AlertCircle, Inbox } from "lucide-react";
import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/60 to-white p-10 text-center">
      <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-50 text-blue-600 ring-1 ring-blue-100/80 shadow-sm">
        {icon ?? <Inbox className="size-9" strokeWidth={1.4} />}
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-6">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

type ErrorStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-10 text-center">
      <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-white text-rose-600 ring-1 ring-rose-200 shadow-sm">
        <AlertCircle className="size-9" strokeWidth={1.6} />
      </div>
      <h3 className="text-lg font-semibold text-rose-700">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-rose-600/80 leading-6">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

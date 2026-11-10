import { PageWrapper } from "@/components/layout/page-wrapper";
import { RoleGuard } from "@/components/auth/guard";
import { CalculatorPnL } from "@/components/calculator/calculator-pnl";

export default function CalculatorPage() {
  return (
    <PageWrapper>
      <RoleGuard allow={["admin", "finance", "sales", "project_manager"]}>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Kalkulator untung</h1>
          <p className="text-muted-foreground mt-1">Hitung perkiraan untung dan PPN sebelum bikin penawaran.</p>
        </div>
        
        <CalculatorPnL />
      </RoleGuard>
    </PageWrapper>
  );
}

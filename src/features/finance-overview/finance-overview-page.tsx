import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { FinanceIcon } from "@/components/tab-icons/tab-icons";

export default function FinanceOverviewPage() {
  return (
    <EmptyTabPlaceholder
      icon={FinanceIcon}
      description="Scope still to be defined — coming once the rest of the backlog is done."
      kawaiiIndex={9}
    />
  );
}

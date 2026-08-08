import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { DiaryIcon } from "@/components/tab-icons/tab-icons";

export default function DiaryPage() {
  return (
    <EmptyTabPlaceholder
      icon={DiaryIcon}
      description="Five gentle daily prompts live here — the first tab being built."
    />
  );
}

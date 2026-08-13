import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { JournalIcon } from "@/components/tab-icons/tab-icons";

export default function JournalPage() {
  return (
    <EmptyTabPlaceholder
      icon={JournalIcon}
      description="Four gentle daily prompts live here."
      kawaiiIndex={1}
    />
  );
}

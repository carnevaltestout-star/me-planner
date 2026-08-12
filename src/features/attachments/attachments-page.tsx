import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { AttachmentsIcon } from "@/components/tab-icons/tab-icons";

export default function AttachmentsPage() {
  return (
    <EmptyTabPlaceholder
      icon={AttachmentsIcon}
      description="Files and notes you're learning from, organized by topic."
      kawaiiIndex={4}
    />
  );
}

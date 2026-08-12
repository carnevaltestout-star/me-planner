import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { GoalsIcon } from "@/components/tab-icons/tab-icons";

export default function GoalsPage() {
  return (
    <EmptyTabPlaceholder
      icon={GoalsIcon}
      description="Card grid or list view — month and quarter goals."
      kawaiiIndex={6}
    />
  );
}

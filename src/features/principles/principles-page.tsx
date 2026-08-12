import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { PrinciplesIcon } from "@/components/tab-icons/tab-icons";

export default function PrinciplesPage() {
  return (
    <EmptyTabPlaceholder
      icon={PrinciplesIcon}
      description="Your essay-style principles, editable and reorderable."
    />
  );
}

import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { VocabularyIcon } from "@/components/tab-icons/tab-icons";

export default function VocabularyPage() {
  return (
    <EmptyTabPlaceholder
      icon={VocabularyIcon}
      description="Your word list, plus a quiz mode to practice recall."
    />
  );
}

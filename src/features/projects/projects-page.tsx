import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { ProjectsIcon } from "@/components/tab-icons/tab-icons";

export default function ProjectsPage() {
  return (
    <EmptyTabPlaceholder
      icon={ProjectsIcon}
      description="Scope still to be defined — coming once the rest of the backlog is done."
      kawaiiIndex={11}
    />
  );
}

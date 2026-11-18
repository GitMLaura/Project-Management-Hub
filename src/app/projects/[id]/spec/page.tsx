import { redirect } from "next/navigation";

// The specification opens on its first tab: the flows.
export default async function SpecIndex(props: PageProps<"/projects/[id]/spec">) {
  const { id } = await props.params;
  redirect(`/projects/${id}/spec/flows`);
}

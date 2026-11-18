import { redirect } from "next/navigation";

// Screens now live inside the flow boards.
export default async function ScreensIndex(props: PageProps<"/projects/[id]/spec/screens">) {
  const { id } = await props.params;
  redirect(`/projects/${id}/spec/flows`);
}

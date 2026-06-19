import { CustomizeFlow } from "@/features/customize";

/**
 * `/customize` — optionally resumes a saved build via the `?build=<id>` param
 * (e.g. when returning from Stripe checkout). The id is handed to the client
 * flow, which loads that session; without it, the intake form starts a new one.
 */
export default async function CustomizePage({
  searchParams,
}: {
  searchParams: Promise<{ build?: string | string[] }>;
}) {
  const params = await searchParams;
  const build = Array.isArray(params.build) ? params.build[0] : params.build;

  return <CustomizeFlow initialBuildId={build} />;
}

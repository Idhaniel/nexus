import { ScenarioBuilder } from "@/components/scenarios/ScenarioBuilder";

export default function NewScenarioPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New scenario</h1>
        <p className="text-muted-foreground">
          Adjust FEW parameters, run the model, then optionally anchor hashes on-chain.
        </p>
      </div>
      <ScenarioBuilder />
    </div>
  );
}

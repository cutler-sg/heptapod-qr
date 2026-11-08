import { z } from "zod";
import { createIR } from "./codec";
import { type State, stateSchema, validateState } from "./model";

const projectSchema = z
  .object({ format: z.literal("arrival-atelier-project/1"), state: stateSchema, ir: z.unknown() })
  .strict();
export function saveProject(state: State): string {
  const validated = validateState(state);
  return `${JSON.stringify({ format: "arrival-atelier-project/1", state: validated, ir: createIR(validated) }, null, 2)}\n`;
}
export function loadProject(json: string): State {
  if (json.length > 100_000) throw new Error("Project exceeds the 100 KB import limit.");
  const project = projectSchema.parse(JSON.parse(json));
  const state = validateState(project.state);
  if (JSON.stringify(project.ir) !== JSON.stringify(createIR(state))) {
    throw new Error(
      "Project IR is inconsistent or uses an unsupported version. Original data has not been loaded.",
    );
  }
  return state;
}

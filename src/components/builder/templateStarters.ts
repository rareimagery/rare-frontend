import type { Data } from "@measured/puck";
import {
  EMPTY_CANVAS,
  TEMPLATE_DEFINITIONS,
  type BuilderStarterInput,
} from "@/templates/registry";
import type { BuilderPreviewPost, PreviewProduct } from "@/templates/types";

export type PreviewPost = BuilderPreviewPost;

export type TemplatePreviewPayload = {
  handle: string;
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  products?: PreviewProduct[];
  posts?: PreviewPost[];
};

export type StarterInput = {
  handle: string;
  bio: string;
  avatar?: string | null;
  banner?: string | null;
  products: PreviewProduct[];
  posts: PreviewPost[];
};

export type TemplateStarter = {
  id: string;
  name: string;
  description: string;
  createData: (input: StarterInput) => Data;
};

export { EMPTY_CANVAS };

export const TEMPLATE_STARTERS: TemplateStarter[] = TEMPLATE_DEFINITIONS.map((template) => ({
  id: template.id,
  name: template.name,
  description: template.description,
  createData: template.createData as (input: BuilderStarterInput) => Data,
}));

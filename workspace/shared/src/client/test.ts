// Rspack should recognize the "@shared" alias from tsconfig and resolve it during the build step.

import { BBB } from "@shared/src/client/test2";

export const AAA = "Yes I am AAA";

export const CCC = `${BBB}`;

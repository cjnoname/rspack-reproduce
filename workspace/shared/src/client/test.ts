// HERE!!! Rspack should recognize the "@shared" alias from tsconfig and resolve it automatically during the build step,
// instead of using the "resolve.alias" option.

import { BBB } from "@shared/src/client/test2";

export const AAA = "Yes I am AAA";

export const CCC = `${BBB}`;

/** Invisible characters: non-whitespace controls, soft hyphens, zero-width and bidi marks, and the BOM. */
export const CONTROL_CHARACTERS = /[\u0000-\u0008\u000e-\u001f\u007f-\u009f­​-‏‪-‮⁠-⁤﻿]/g

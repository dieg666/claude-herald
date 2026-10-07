/**
 * Characters that are invisible or break a line of text: controls other than whitespace, soft
 * hyphens, zero-width and bidirectional marks, and the byte order mark.
 */
export const CONTROL_CHARACTERS = /[\u0000-\u0008\u000e-\u001f\u007f-\u009f­​-‏‪-‮⁠-⁤﻿]/g

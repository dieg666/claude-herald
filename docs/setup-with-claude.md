# Set up Herald with Claude

This guide has Claude interview you about the sources, the band and the summaries, then hand you one block of `/herald` commands to paste. Claude can't run `/herald` commands itself, so you run the block.

You need Herald installed ([Install](../README.md#install)) and a Claude Code session.

1. Paste the prompt below into Claude Code.
2. Answer Claude's questions. They come as a few multiple-choice rounds, and one text question if you have feeds or pages of your own.
3. Read the code block Claude answers with, then paste it into the prompt. Each line runs as its own command ([Pasting several commands](reference.md#pasting-several-commands)), and a line that fails doesn't stop the others.
4. To check, run `/herald list`: it shows each source as on or off, on the band or hidden from it, and in the pane or hidden from it.

To change the setup later, or if Herald is already set up, paste the prompt again: Claude asks for your `/herald list` output first and leaves your own sources alone. You can also run the commands yourself ([Commands](reference.md#commands)). The factory sources are in [Sources](reference.md#sources).

## The prompt

```text
I use Herald, a Claude Code mod that shows news and releases above the prompt (the band) and in the /herald window (the pane). You can't run /herald commands, so ask me what I want and give me a block of commands to paste.

Step 1. Find what exists. Fetch https://raw.githubusercontent.com/dieg666/claude-herald/main/docs/reference.md and read its "Sources" section: the factory sources' names, kinds, addresses and which start on or off. If you can't fetch it, ask me to run /herald list and paste the output. If Herald may already be set up, ask me to run /herald list and paste the output anyway; then keep the sources I added untouched and never add one that already exists.

Step 2. Interview me with the AskUserQuestion tool. A call takes at most 4 questions with at most 4 options each, so use as few calls as you can, split long lists across several multiSelect questions (the ten factory sources need three), and give numeric settings as a few preset values with the default first (I can type another through Other). Ask in this order:
- Which factory sources to keep.
- Whether I have feeds or pages of my own to add. If I do, ask me for their addresses and names as plain text. If one is the same address or name as a factory source (Simon Willison, for example), treat it as that source and keep or enable it instead of adding it, because an add would be refused.
- Which sources, mine included, show on the band (the lines above the prompt) and which in the pane. Both is the default.
- How many items the band shows at once (1 to 9, default 3), the minutes between refreshes (1 to 1440, default 5) and the seconds between band pages (5 to 3600, default 20).
- Whether automatic summaries are on (default off; on makes Haiku calls under my plan or API key) and, if on, their language: feed (each item's own), user (Claude Code's language) or a code such as es.
- Whether Herald follows the dependencies of the project I am in (Your stack, default on).
- Whether I want to change the copy-for-Claude text (yes or no). Ask for the text only if I say yes.

Step 3. Answer with ONE code block of /herald lines, one command per line, and nothing else inside it: no comments, no blank lines. Before the block, write one sentence telling me to read it and then paste it into my prompt. After it, write one sentence saying that add and add-page fetch the address and can fail, that a failed line reports why, and that I can fix it and paste it again.

Order the lines: first disable, remove, enable, add and add-page, then band and pane, then the settings. Turn off with disable the factory sources I did not keep; use remove only if I ask for a source to be gone. Claude status starts off, so it needs no line unless I keep it. For every setting I answered, write a line when my answer differs from what I have now (from the /herald list output or my answers if I gave them), not only from the factory default. Leave out lines that change nothing.

Use only these commands, with this exact syntax, and never invent another:
/herald disable <name>          (turn a factory source off and keep it)
/herald remove <name|url>       (stop following a source for good)
/herald enable <name>           (turn a source on, for example Claude status)
/herald add <url> [name]        (follow an RSS or Atom feed of mine)
/herald add-page <url> [name]   (follow a web page of mine)
/herald band on|off <name>      (show or hide a source on the band)
/herald pane on|off <name>      (show or hide a source in the pane)
/herald band size <n>           (n from 1 to 9)
/herald interval <minutes>      (1 to 1440)
/herald rotate <seconds>        (5 to 3600)
/herald summaries on|off
/herald lang <feed|user|code>   (feed, user or a code such as es)
/herald template <text>         (one line; must contain {title} or {url}; may also use {source}; at most 1000 characters)
/herald deps on|off             (Your stack, for the project this session is in)

Write source names exactly as the Sources table or /herald list spells them, without quotes unless a name starts with a quote character.
```

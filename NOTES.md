# Project Notes

## Hard requirements (from the rules)

- [ ] Working **live URL**, reachable via ChatGPT in-app browser or Chrome + WebMCP
- [ ] WebMCP tool registration in code (function schema + execution logic)
- [ ] Public repo with a visible **open-source license** (done: MIT)
- [ ] Text description: why the use case fits WebMCP, UX benefit, what humans+agents
      can now do together, implementation approach
- [ ] Demo video < 3 min, public YouTube, **with audio**
- [ ] New project, or pre-existing + meaningfully extended with WebMCP after Aug 25
- [ ] Submit before **Sept 3, 2026, 1:00 PM PT**

## Judging criteria (equal weight)

1. WebMCP Leverage — non-trivial, skillful use of the standard
2. Execution — complete, coherent, runnable product
3. Potential Impact — real problem, real audience
4. Creativity & Ambition — novel vs. existing solutions

## Design implications

- The interesting apps expose tools that are **hard to do by hand** — multi-step,
  stateful, or requiring judgement — so the human+agent combo beats either alone.
- Keep the page fully usable by a human too (agent is an accelerant, not the only UI).
- Watch tool security: prompt-injection / trust boundaries (see WebMCP security guide).

## Idea candidates (fill in)

| Idea | Who it's for | Tools exposed | Why WebMCP specifically |
|------|--------------|---------------|-------------------------|
|      |              |               |                         |

## Stack decision

- Hosting options w/ sponsor credits: Cloudflare, Vercel, Netlify, Render, ChatGPT Sites
- Chrome hook: `useWebMCPTool` (React). Cloudflare has a Workers React template.
- Decision: _pending_

## Links

- Spec: https://github.com/webmachinelearning/webmcp
- Chrome docs: https://developer.chrome.com (WebMCP)
- OpenAI WebMCP guide + Showcase
- Devpost: https://webmcp.devpost.com

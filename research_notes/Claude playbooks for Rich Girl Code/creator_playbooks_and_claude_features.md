# Creator Playbooks for Running a Business with Claude (2026) and the Claude Features Behind Them

> Research method note (2026-11-05): I couldn't fetch full pages in this session. These hosts all failed DNS because the session network allowlist blocks them: recapio.com, teamday.ai, sozai.app, tubescript.cc, summyt.app, magica.com, videohighlight.com and skool.com. Everything below comes from web search result snippets and the summaries they returned. I could not read full transcripts. Treat creator-specific details as secondhand, since they come from AI-generated summary pages. Anything I could not confirm is listed under Gaps.

## 1. What do the specific creators/videos teach?

### Takeaway
Every video teaches the same basic stack. There is a plain-text "business brain" or context file (CLAUDE.md). Repeatable work becomes reusable **Skills** (playbooks), and **sub-agents** or "departments" do work in parallel. **MCP/connectors** link Claude to outside data such as YouTube, Gmail and CRMs. The human acts as a CEO who reviews the output. The creators differ mainly in their example workflows and in how they organize departments.

### Cited Findings

**Rashid, "Claude Code for Business: Run 90% of Your Business with AI Agents" (c. Jan 2026)**
- TeamDay's summary page is titled "How Claude Code Can Run 90% of Your Business" and is dated January 2026. It describes an architecture with three parts: a **CLAUDE.md "routing" file**, **skills as reusable task instructions**, and **MCP connections** to external services such as YouTube. — [TeamDay](https://www.teamday.ai/ai/rashid-claude-code-business-90-percent-ai)
- His worked example is a **"YouTube Breakout Video Researcher"** that connects Claude Code to the YouTube Data API. — [TeamDay](https://www.teamday.ai/ai/rashid-claude-code-business-90-percent-ai)
- Skills load only when a request needs them. **Opus acts as the orchestrator** and coordinates sub-agents. He claims sub-agents finish "a week" of work in about ten minutes. This is the creator's own claim and has not been verified. — [TeamDay](https://www.teamday.ai/ai/rashid-claude-code-business-90-percent-ai)
- A recap says agents that read files, connect to tools and run work can automate "80–90%" of business tasks without coding. It lists "Implement Agent Skills" (reusable playbooks) as one step. — [Recapio digest](https://recapio.com/digest/claude-code-for-business-run-90-of-your-business-with-ai-agents-by-rashid); [VideoHighlight](https://videohighlight.com/v/P9LXcBEpD7w)
- An agency blog describes the same three layers: Claude reasoning, persistent memory in CLAUDE.md-style files, and tool connections through APIs/MCP. The framing is that "the user reviews output rather than doing the work." The blog is promotional. — [GrowwStacks](https://growwstacks.com/blog/claude-code-for-business-run-90-percent-with-ai-agents/)
- No independent or Anthropic source supports the 80–90% figure. — (same search; promotional sources only)

**Nick Puru (AI Automation), "How to Run Your Entire Business With Claude Code (No Coding Required)"**
- The transcript calls **CLAUDE.md the "business brain"** and the central reference. You package your context once and Claude then applies it consistently. — [TubeScript transcript](https://tubescript.cc/transcript/qDLzZB5fB_s); [SozAI transcript](https://sozai.app/transcript/run-entire-business-claude-code-no-coding/)
- He says he runs his whole business on Claude Code and has "never written a single line of code." He uses "AI workers" in place of paid staff for jobs such as handling email requests and follow-ups. — [ai-core beehiiv](https://ai-core.beehiiv.com/p/run-your-entire-business-with-claude-code-no-coding-required); [SozAI](https://sozai.app/transcript/run-entire-business-claude-code-no-coding/)
- He names four building blocks: **CLAUDE.md** ("memory, your business in plain text, read every conversation"), **Skills**, **Plugins** and **Subagents**. — [Skool "Systems to Scale" post](https://www.skool.com/systems-to-scale-9517/new-video-claude-code-for-business-run-your-entire-company-with-an-ai-team) (search snippet)
- Background from the docs: Claude Code reads CLAUDE.md from the project directory at the start of every session. A copy in the home directory applies globally. — [DEV Community](https://dev.to/whoffagents/the-claude-code-claudemd-file-give-your-ai-assistant-persistent-context-3l7)

**Eric Siu (Leveling Up / Single Grain), "7 Ways I Use Claude Code To Run My Business (Feels Like Cheating)", released Jan 20, 2026, about 15 minutes**
- A Recapio AI summary says the episode covers building tools for **deal revival, data analysis, content repurposing and go-to-market strategy**. I couldn't confirm the full list of seven. — [Recapio](https://recapio.com/digest/7-ways-i-use-claude-code-to-run-my-business-feels-like-cheating-by-leveling-up-with-eric-siu); [Pulse.bot](https://www.pulse.bot/ai/video/7-ways-i-use-claude-code-to-run-my-business-feels-like-cheating-e2ae9efb-a349-456e-bbff-48b7bc6268af/)
- A related Siu episode is titled "Claude Code replaced my $50k marketing team" (Pulse.bot, Feb 5, 2026). In it he has Claude analyze existing content, past campaigns and customer data, then turn that into a working go-to-market system. — [Pulse.bot](https://www.pulse.bot/digital-marketing/video/claude-code-replaced-my-50k-marketing-team-for-free-518536c3-93f2-49c6-a785-40f38e6842d7)
- Other Siu episodes cover the same ground: "How I Use Claude Code and Manus To Run My Business", "I gave Claude one task, now I have an entire marketing army" and "Setting up marketing agents in minutes". — [Recapio](https://recapio.com/digest/how-i-use-claude-code-and-manus-to-run-my-business-by-leveling-up-with-eric-siu); [PocketCasts](https://pocketcasts.com/podcast/leveling-up-with-eric-siu/70d18ae0-5e91-0131-8ccb-723c91aeae46/i-gave-claude-one-task-now-i-have-an-entire-marketing-army/624ea5d1-8618-4fc5-bf74-553d41c94cc3); [Player.fm](https://el.player.fm/series/leveling-up-with-eric-siu-1277552/setting-up-marketing-agents-in-minutes-a-step-by-step-guide)

**Daron Vener, "Claude Code for Business: Run Your Entire Company With AI Team"**
- Vener is a non-developer who calls Claude Code his "AI operating system" and says he has spent more than 1,200 hours running his business through it. — [TeamDay person page](https://www.teamday.ai/ai/people/daron-vener)
- He organizes his departments like a company: **Attract** (traffic/content), **Convert** (copywriting/sales), **Retain & Deliver** (fulfillment/community), **Ascend** (upsells/engagement), plus **Finance** and **HR/Engineering**. Each department runs a team of specialized agents built from Claude Code **skills, subagents and agent teams**, and a central operations layer coordinates priorities. — [TeamDay](https://teamday.pages.dev/ai/people/daron-vener); [TeamDay "9 components of an AI OS"](https://teamday.pages.dev/ai/ai-operating-system-nine-components-claude-code)
- He replaced standalone SaaS tools, including **spreadsheets, databases and even a CRM**, with Claude Code-native versions. The human plays CEO: "validate strategy, distribute work to AI teams, review outputs." — [TeamDay](https://www.teamday.ai/ai/people/daron-vener)
- The video summary describes Claude Code as a "complete business OS with persistent memory and self-orchestrating AI teams." He runs a paid community called CCG (Claude Code Group). — [Summyt](https://summyt.app/summaries/business/claude-code-for-business-run-your-entire-company-with-ai-team-cnBv7krgVdQ); [TeamDay](https://www.teamday.ai/ai/people/daron-vener)
- One article with the same title is dated 2025-11-15, which suggests the video dates from about November 2025. — [Francesca Tabor](https://www.francescatabor.com/articles/2025/11/15/claude-code-for-business-run-your-entire-company-with-ai-team)

**"16 ways to run your entire business with Claude" (creator unconfirmed)**
- The summary describes 16 ways plus 3 bonus moves, ranging from content creation and sales copy to inbox management and data analysis. Connecting Claude to **Gmail, Calendar, notes and files** lets it act inside the business, for example creating pages and drafting replies. — [Magica summary](https://magica.com/youtube-summarizer/16-ways-to-run-your-entire-business-with-claude-and-transform-your-workflow-MATaHS06K3A) (search snippet)
- A related LinkedIn list of 16 workflows includes "create Skills for repeatable tasks" and a **"10-80-10" rule**: you do the first 10%, Claude does 80%, and you own the final 10%. — [LinkedIn snippet via search](https://fr.linkedin.com/in/adil-moukrim)

**"I Let Claude Cowork Run My Business for a Day" (creator unconfirmed)**
- The aggregator only showed the title and section headings, so I found no content. — [VideoHighlight](https://videohighlight.com/v/ghf8R_G9oNs)
- A similar first-person account on DEV hands a day of busywork to Cowork and reports what came back. — [DEV Community](https://dev.to/suraj_khaitan_f893c243958/claude-cowork-review-i-handed-it-a-day-of-my-busywork-heres-what-came-back-1b92)
- A practitioner's advice on Reddit: "don't hand over your entire business operations on day one." — [Reddit snapshot](https://reddit.sentinel-team.org/posts/1tmpeq5/snapshots/2026-05-29T18%3A50%3A49.032229Z)

### Inferences
- The creator material is most consistent for Rashid (TeamDay) and Vener (TeamDay and Summyt). It is thinnest for the Cowork-for-a-day and 16-ways videos, where only titles or headings were visible.
- Most creators sell courses or communities (CCG, Skool "Systems to Scale", Single Grain webinars). Their productivity claims (90%, 1,200 hours, "a week in 10 minutes", "$50k team") are self-reported marketing.

### Gaps
- Full transcripts were unavailable because the summary sites are blocked. I have no exact CLAUDE.md templates, folder trees or skill file contents from any creator.
- I couldn't confirm Eric Siu's full list of seven or the details of his "deal revival" workflow.
- I couldn't identify the creators of the "16 ways" and "Cowork for a day" videos, or read their content.

## 2. Common patterns across playbooks

### Takeaway
There are six repeating building blocks: (1) a business context file, (2) Skills as SOPs, (3) sub-agents or departments, (4) connectors/MCP to email, calendar, Drive and CRM, (5) scheduled or recurring runs, and (6) research and repurposing pipelines. Every playbook also keeps a human in the review seat.

### Cited Findings
- **Business context file:** CLAUDE.md is the "business brain" (Puru) or "routing file" (Rashid). Claude Code reads it automatically at the start of every session. — [TubeScript](https://tubescript.cc/transcript/qDLzZB5fB_s); [TeamDay](https://www.teamday.ai/ai/rashid-claude-code-business-90-percent-ai); [MindStudio](https://www.mindstudio.ai/blog/what-is-ai-operating-system-build-with-claude-code)
- **Claude Projects as the context file in chat:** "Projects give Claude persistent context about your business across every conversation." — [Sherise Adkins](https://www.sheriseadkins.com.au/blog/how-to-actually-use-claude-for-business)
- **Skills as reusable playbooks:** Skills load only when relevant (Rashid). The "create Skills for repeatable tasks" item also appears. — [TeamDay](https://www.teamday.ai/ai/rashid-claude-code-business-90-percent-ai); [LinkedIn](https://fr.linkedin.com/in/adil-moukrim)
- **Sub-agents / departments:** Each subagent runs in its own context window, which keeps the main conversation clean. Plugins make sense once you have 3–5 related skills, commands or agents. Combining skills, plugins and subagents is "where the system that runs your business starts to compound." — [Medium overview](https://medium.com/@mishra.shashank35/claude-code-skills-subagents-hooks-and-plugins-a-practical-overview-572de7cedb20); [Octavius](https://octavius.ai/business-automation/claude-code-skills-vs-plugins/)
- **Connectors:** Gmail, Calendar, notes and files ("16 ways"). YouTube Data API through MCP (Rashid). An Ahrefs MCP for keyword rankings appears in a marketing GTM example. CRM connections (HubSpot, Salesforce, Airtable) appear in AI-OS frameworks. — [Magica](https://magica.com/youtube-summarizer/16-ways-to-run-your-entire-business-with-claude-and-transform-your-workflow-MATaHS06K3A); [Runbear/Medium](https://snow.runbear.io/how-i-built-an-ai-marketing-team-with-claude-code-and-cowork-f3405a53ee22); [MindStudio](https://www.mindstudio.ai/blog/ai-operating-system-claude-code-four-cs-framework)
- **Scheduled/recurring work:** A daily 8:00 AM brief set up as a Cowork scheduled task appears in a Claude for Small Business review. — [note.com VESS Labs](https://note.com/vesslabs/n/n882ba23cf7e2?hl=en)
- **Research and repurposing:** a YouTube breakout-video researcher (Rashid) and content repurposing (Siu). — [TeamDay](https://www.teamday.ai/ai/rashid-claude-code-business-90-percent-ai); [Recapio](https://recapio.com/digest/7-ways-i-use-claude-code-to-run-my-business-feels-like-cheating-by-leveling-up-with-eric-siu)
- **Open-source starter kits** exist that package these ideas. One example is nateherkai/AIS-OS, an "AI Operating System starter kit" with five skills: /onboard, /audit, /link, /level-up and /3d-brain. — [GitHub](https://github.com/nateherkai/AIS-OS)
- **Persistent memory beyond CLAUDE.md:** some AI-OS builds add a local SQLite memory ranked by importance, salience and recency. — [MindStudio](https://www.mindstudio.ai/blog/multi-agent-os-claude-code-hive-mind-6-components)

### Inferences
- A starter template a solo founder could copy:
  - `CLAUDE.md`: who we are, offers, ICP, voice, pricing, rules, and pointers to folders.
  - Department folders such as `/marketing` and `/sales`, each with its own context.
  - A `.claude/skills/<name>/SKILL.md` for each SOP.
  - Subagents for parallel research.
  - Connectors for Gmail, Calendar, Drive and CRM.
  - A few scheduled tasks: a morning brief, a weekly content plan and invoice chasing.

  This is a synthesis of the sources above, not one creator's published template.

### Gaps
- None of the creators published a verifiable folder structure that I could read.

## 3. Official Claude features (late 2026): Cowork, Code, Skills, Projects, connectors, scheduled tasks, Artifacts, pricing

### Takeaway
Everything the creators teach now has an official product feature behind it. Cowork brings agentic work to non-coders and has scheduled tasks that run in the cloud. Skills are SKILL.md folders that you upload as a ZIP or keep in Claude Code. Plugins bundle skills, connectors and sub-agents. Connectors cover Gmail, Drive, Slack and more. Claude for Small Business, launched May 13, 2026, adds QuickBooks, PayPal and HubSpot workflows with approval gates. Artifacts can persist data. Pricing runs from Pro at $20 up to Ultra at $200, and Claude chat, Code and Cowork draw on one shared usage pool.

### Cited Findings

**Claude Cowork timeline**
- Launched as a research preview on **Jan 12, 2026** for Max plans on macOS, and expanded to Pro on Jan 16, 2026. — [Unite.AI / timeline sources](https://www.unite.ai/anthropic-folds-cowork-into-a-single-claude-experience-across-plans/); [NewsBytes](https://www.newsbytesapp.com/news/science/anthropic-releases-cowork-research-preview-exclusively-to-claude-max-subscribers/tldr)
- One source reports general availability on macOS and Windows on **Apr 9, 2026**. Anthropic's product page still said "research preview" when indexed. — [search summary](https://www.unite.ai/anthropic-folds-cowork-into-a-single-claude-experience-across-plans/); [Anthropic Cowork page](https://anthropic.com/product/claude-cowork)
- **Sept 16, 2026:** Anthropic announced that Cowork and Claude chat are merging into "one Claude" for Pro and Max over the following weeks. Only one source reports this. — [Unite.AI](https://www.unite.ai/anthropic-folds-cowork-into-a-single-claude-experience-across-plans/)
- Cowork now runs on web, desktop and mobile. — [support.claude.com](https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile)
- **Computer use** is a research preview in Cowork and Claude Code, macOS only. It lets Claude open apps, navigate the browser and fill in spreadsheets. — [@claudeai on X](https://x.com/claudeai/status/2036195789601374705)
- **Plugins** for Cowork are a research preview for all paid users. — [Reworked](https://www.reworked.co/collaboration-productivity/anthropic-adds-plugins-to-claude-cowork/)

**Scheduled tasks (Cowork)**
- Scheduled tasks **now run remotely in the cloud**, so they keep running while your computer is asleep or the desktop app is closed. Tasks created **before Oct 6** on Pro, Max and Ultra still run locally. — [support.claude.com: Schedule recurring tasks](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork)
- Each run is its own session with the same capabilities as a normal Cowork task: connected tools, skills and installed plugins. **Local connectors, and plugins that bundle local MCP servers, work only in the desktop app.** You create tasks from "Scheduled" in the Cowork sidebar. — [support.claude.com](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork)
- A third-party source says Cowork and scheduled tasks require a paid plan. — [Claude Cowork Expert](https://www.claudecoworkexpert.com/en/features/)

**Skills**
- On claude.ai you add a skill with "+" → "Create skill" → "Upload a skill" and upload a **ZIP of the skill folder**. A missing **SKILL.md** is a common upload error. Admins can provision skills org-wide or block user-created skills. — [support.claude.com: Use skills](https://support.claude.com/en/articles/12512180-use-skills-in-claude)
- Claude Code skills follow the open Agent Skills standard and live in the project or user directory. — [Claude Code docs: skills](https://code.claude.com/docs/en/skills); [Platform docs: Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- One guide says custom skills need Pro, Max, Ultra, Team or Enterprise with code execution enabled. Another says custom skills don't sync across surfaces. Both are third-party claims. — [AgentsCamp](https://agentscamp.com/guides/skills/claude-skills-on-claude-ai-and-api)
- Anthropic's own how-to: [claude.com blog](https://claude.com/blog/how-to-create-skills-key-steps-limitations-and-examples); [claude.com docs](https://claude.com/docs/skills/how-to)

**Plugins & connectors**
- Claude connects to Google Drive, Gmail, Slack, DocuSign "and many more." Plugins can bundle connectors so a workflow's services come set up together. — [support.claude.com: Use plugins](https://support.claude.com/en/articles/13837440-use-plugins-in-claude)
- Plugins typically bundle connectors, skills and sub-agents. — [Claude Cowork Expert](https://www.claudecoworkexpert.com/en/features/)

**Claude for Small Business (launched May 13, 2026)**
- It is a toggle inside Cowork, not a separate pricing tier. — [Digital Applied](https://www.digitalapplied.com/blog/claude-for-small-business-quickbooks-hubspot)
- It reconciles QuickBooks cash against PayPal settlements, closes the books, chases overdue invoices and pulls HubSpot campaign data. **Each workflow waits for user sign-off before anything is sent, posted or paid.** — [Quartz](https://qz.com/anthropic-claude-small-business-quickbooks-paypal-051326); [Companies Made Simple](https://www.companiesmadesimple.com/blogs/small-business-advice/claude-for-small-business)
- Anthropic's small business page covers scheduled tasks for follow-ups, overdue invoices and reorders, with nothing sent until you approve it. — [claude.com/solutions/small-business](https://claude.com/es/solutions/small-business)
- **The counts conflict:** sources say 15 workflows plus 15 skills, 31 skills, or 43 workflows. Integrations mentioned also include Stripe, Canva and Square. — [MindStudio](https://www.mindstudio.ai/blog/claude-small-business-plugin-pack-finance-hr-sales); [We Call Shotgun](https://wecallshotgun.com/blog/claude-for-small-business-31-skills-guide); [WotAI](https://wotai.co/blog/claude-for-small-business)

**Artifacts with persistent storage**
- Each artifact gets about **20 MB** of storage. **Personal** storage is private to each viewer, and **shared** storage is one pool everyone reads and writes. Storage works only on **published** artifacts and can fail silently during development. — [Homespun](https://homespun.dev/guides/can-claude-artifacts-store-data); [Masset](https://www.getmasset.com/resources/claude-artifacts-for-marketers)
- Shared storage asks the viewer to confirm before first use. One source says storage is text-only. Each artifact's data is separate, even within the same Project. Deleting an artifact deletes its data. — [Masset](https://www.getmasset.com/resources/claude-artifacts-for-marketers); [Albato](https://albato.com/blog/publications/how-to-use-claude-artifacts-guide); [MemoryBase](https://www.memorybase.app/blog/claude-projects-and-artifacts); [Stacktree](https://stacktr.ee/blog/claude-artifacts-public-sharing)
- **Dates conflict.** Storage was reportedly added on Oct 21, 2025. Public sharing and multiplayer editing for Claude Code artifacts reportedly arrived Jul 13, 2026. Artifacts were reportedly rebuilt in Sept 2026 with an Artifacts tab. — [Masset](https://www.getmasset.com/resources/claude-artifacts-for-marketers); [Stacktree](https://stacktr.ee/blog/claude-artifacts-public-sharing); [AI Codex](https://www.aicodex.to/articles/claude-artifacts-guide)
- **Plans conflict:** some sources say persistent storage needs a paid plan, while another says free accounts can create artifacts but get no storage. — [tiiny.host](https://tiiny.host/blog/claude-artifacts/); [Homespun](https://homespun.dev/guides/can-claude-artifacts-store-data)

**Pricing and usage limits (as of about Nov 2026)**
- Official pricing page: **Max = 5x Pro usage, per 5 hours and per week**. **Ultra = 10x Pro weekly usage, with no 5-hour limit for verified accounts.** Both include the top model ("Fable") for up to half the weekly limit and a monthly API credit: $100 on Max and $200 on Ultra. — [claude.com/pricing](https://claude.com/pricing) (via search snippet)
- One report says the tiers were **renamed on Oct 30, 2026**: Max 5x became "Max" at $100/month and Max 20x became "Ultra" at $200/month. Older coverage still lists "Max 20x" at $200. — [Walma AI / search summary](https://walma.ai/en/guides/ai-tools/claude-plans); [MindStudio](https://www.mindstudio.ai/blog/claude-pricing-plans-explained)
- Pro costs **$20/month**. Commentators call it the entry point for non-technical founders. — [blog.mean.ceo](https://blog.mean.ceo/claude-code-news-june-2026/)
- **Team:** a standard seat is about $25/seat/month ($20 billed annually) with a 5-seat minimum. A premium seat gives 5x a standard seat for about $125 ($100 billed annually). Limits apply per member and are not pooled. These figures are third-party and unverified. — [Layer3 Labs](https://www.layer3labs.io/guides/claude-pro-vs-max-for-teams); [Jamie Lord](https://lord.technology/2026/03/28/claude-team-premium-vs-max-plans-usage-limits-pricing-and-which-to-choose.html)
- **Claude chat, Claude Code and Cowork share one usage pool.** An independent measurement in late Oct 2026 put the top tier's weekly limit at about 10x Pro. Anthropic doesn't publish weekly token counts. — [Wokey](https://wokey.ai/claude-usage-limits)
- Code Review (Mar 9, 2026) costs about $15–25 per review. — [CodeMySpec](https://codemyspec.com/blog/claude-code-review-2026)

### Inferences
- A solo founder can get Cowork, Skills, connectors and scheduled tasks on Pro at $20. Running agents and sub-agents heavily every day (Rashid/Vener style) will probably require Max or Ultra, because everything draws on one pool.
- The Small Business approval gate and the cloud scheduled tasks are the official versions of the creators' "AI employee" idea.

### Gaps
- I couldn't verify the current official Team seat prices, whether the Oct 30 tier rename happened, or the exact Max/Ultra prices on Anthropic's own help center.
- I found no official Anthropic announcement for artifact storage, and the dates and plan tiers above conflict.
- I couldn't confirm whether the "one Claude" merger (Sept 2026) changed how Projects work.

## 4. Limits, failure modes and risks

### Takeaway
The main risks are hitting usage caps, prompt injection through documents and connectors, destructive file actions, and hallucinated or wrong outputs. Anthropic and reviewers both say to keep a human in the loop, scope folder and connector access tightly, and treat outputs as drafts. All of the "90%" claims are marketing.

### Cited Findings
- **Usage caps** are "the #1 complaint, in nearly every thread." In March 2026 Anthropic acknowledged people were "hitting usage limits in Claude Code way faster than expected." TechCrunch reported unexpectedly tight limits as far back as July 2025. — [CodeMySpec](https://codemyspec.com/blog/claude-code-review-2026); [Pulse.bot](https://www.pulse.bot/ai/news/claude-code-users-hitting-usage-limits-way-faster-than-expected-acaf860e-ab53-4058-a3c7-4ad39f1135a6/); [DevOps.com](https://devops.com/claude-code-quota-limits-usage-problems/)
- **API cost surprise:** several bootstrapped founders reportedly burned a month's budget in the first week by running bulk content generation through the API without understanding token costs. — [blog.mean.ceo](https://blog.mean.ceo/claude-code-news-june-2026/)
- **Prompt injection** (Anthropic's definition): malicious instructions hidden in external content that Claude reads during a legitimate task can hijack it. Anthropic advises limiting access to sensitive folders and allowing internet access only to trusted sites. — [support.claude.com: Use Cowork safely](https://support.claude.com/en/articles/13364135-use-claude-cowork-safely)
- One reported case: a Word document with 1-point white text caused Cowork to upload a user's financial documents to an attacker's account. This comes from a security vendor and has not been verified. — [TrueFoundry / search summary](https://www.truefoundry.com/blog/claude-cowork-security-risks)
- **Deletion:** Anthropic says Claude always asks before permanently deleting files. A reviewer reported Cowork deleting 11 GB of a user's files in a first-impressions video. This is anecdotal. — [support.claude.com](https://support.claude.com/en/articles/13364135-use-claude-cowork-safely); [LowCode Agency](https://www.lowcode.agency/blog/claude-cowork-review)
- **Errors:** Anthropic says human oversight is recommended in high-stakes situations because Claude can make mistakes. Commentators warn that a hallucination or logic error without a human in the loop can corrupt data or change configurations. — [Fast.io summarizing Anthropic](https://fast.io/resources/claude-cowork-safety/); [Aurascape](https://aurascape.ai/answers/what-are-the-risks-of-using-claude-cowork-at-work/)
- **Review:** guides say important documents, financial data and regulated information need human review before you act on them. They also recommend turning off "Always Allow" for high-risk tools. — [LowCode Agency](https://www.lowcode.agency/blog/claude-cowork-review); [Obot](https://obot.ai/resources/learning-center/claude-cowork-security-whats-actually-documented-not-whats-assumed/)
- **Audit:** one guide says Cowork lacked audit logging during its preview. — [GeneralAnalysis](https://generalanalysis.com/guides/security-guidance-for-claude-cowork-and-risks)
- **Workplace readiness:** press coverage says Cowork shows how unready workplaces are for AI agents. — [Reworked](https://www.reworked.co/collaboration-productivity/claude-cowork-is-a-productivity-test-enterprises-may-fail/)
- **Data privacy:** a practitioner notes that Anthropic says it doesn't train Claude on your business data. This is secondhand, so check the plan's terms. — [Reddit snapshot](https://reddit.sentinel-team.org/posts/1tmpeq5/snapshots/2026-05-29T18%3A50%3A49.032229Z)
- **Gradual rollout:** "don't hand over your entire business operations on day one." The 10-80-10 rule says the human owns the final 10%. — [Reddit](https://reddit.sentinel-team.org/posts/1tmpeq5/snapshots/2026-05-29T18%3A50%3A49.032229Z); [LinkedIn](https://fr.linkedin.com/in/adil-moukrim)
- **Built-in mitigation:** Claude for Small Business requires sign-off before anything is sent, posted or paid. — [Quartz](https://qz.com/anthropic-claude-small-business-quickbooks-paypal-051326)

### Inferences
- For a solo founder, sensible defaults are:
  - Keep draft-then-approve for email, payments and posts.
  - Give connectors read-only or narrowly scoped access where possible.
  - Keep client or financial folders out of Cowork's working folder unless the task needs them.
  - Watch usage, because chat, Code and Cowork share one pool.

### Gaps
- None of the creators' own failure stories could be read, because transcripts were blocked.
- I didn't verify official data-retention or training terms for each plan.

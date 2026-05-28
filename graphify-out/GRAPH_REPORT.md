# Graph Report - .  (2026-05-28)

## Corpus Check
- Corpus is ~6,873 words - fits in a single context window. You may not need a graph.

## Summary
- 50 nodes · 68 edges · 9 communities (7 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Supabase Integration & Drug Lookup|Supabase Integration & Drug Lookup]]
- [[_COMMUNITY_State Persistence & Dispensa|State Persistence & Dispensa]]
- [[_COMMUNITY_Safety Gate & Drug Addition|Safety Gate & Drug Addition]]
- [[_COMMUNITY_Therapy Cycles & Adherence|Therapy Cycles & Adherence]]
- [[_COMMUNITY_Navigation & Screen Routing|Navigation & Screen Routing]]
- [[_COMMUNITY_App Architecture & PRD|App Architecture & PRD]]
- [[_COMMUNITY_CSS Theming & UI Utilities|CSS Theming & UI Utilities]]
- [[_COMMUNITY_Scanner Module|Scanner Module]]
- [[_COMMUNITY_Drug Search Module|Drug Search Module]]

## God Nodes (most connected - your core abstractions)
1. `navigate(screenId)` - 8 edges
2. `State Object` - 7 edges
3. `addToDispensa()` - 7 edges
4. `renderCure()` - 6 edges
5. `saveState()` - 5 edges
6. `fetchByAIC(aic)` - 5 edges
7. `renderDispensa()` - 5 edges
8. `DOMContentLoaded Init` - 5 edges
9. `localStorage (scanmed_v1)` - 5 edges
10. `searchFarmaci(query)` - 4 edges

## Surprising Connections (you probably didn't know these)
- `AIC Padding Rationale` --rationale_for--> `fetchByAIC(aic)`  [EXTRACTED]
  CLAUDE.md → index.html
- `Dispensa Module (PRD §3.3)` --references--> `renderDispensa()`  [EXTRACTED]
  PRD-scanmed.md → index.html
- `Safety Gate Design Rationale` --rationale_for--> `addToDispensa()`  [EXTRACTED]
  CLAUDE.md → index.html
- `Offline-First / localStorage Rationale` --rationale_for--> `localStorage (scanmed_v1)`  [EXTRACTED]
  PRD-scanmed.md → index.html
- `ScanMed Application` --references--> `index.html (Single-File App)`  [EXTRACTED]
  CLAUDE.md → index.html

## Hyperedges (group relationships)
- **Safety Gate Flow: addToDispensa → checkDuplicatePrincipio → showSafetyAlert** — indexhtml_addtodispensa, indexhtml_checkduplicateprincipio, indexhtml_showsafetyalert, indexhtml_modal_safety_alert [EXTRACTED 1.00]
- **Supabase Query Flow: Config → fetchByAIC/searchFarmaci → farmaci table** — indexhtml_config, indexhtml_fetchbyaic, indexhtml_searchfarmaci, indexhtml_supabase_farmaci_table [EXTRACTED 1.00]
- **Persistence Flow: state ↔ localStorage ↔ loadState/saveState/seedMockData** — indexhtml_state, indexhtml_localstorage, indexhtml_loadstate, indexhtml_savestate, indexhtml_seedmockdata [EXTRACTED 1.00]

## Communities (9 total, 2 thin omitted)

### Community 0 - "Supabase Integration & Drug Lookup"
Cohesion: 0.25
Nodes (10): Supabase Config (SB_URL, SB_KEY, LS_KEY), DOMContentLoaded Init, fetchByAIC(aic), initScanner(), initSearch(), searchFarmaci(query), Supabase farmaci Table, Scanner Module (PRD §3.1) (+2 more)

### Community 1 - "State Persistence & Dispensa"
Cohesion: 0.27
Nodes (11): Cicli Data Model, Dispensa Data Model, loadState(), localStorage (scanmed_v1), removeFromDispensa(), renderDispensa(), saveState(), seedMockData() (+3 more)

### Community 2 - "Safety Gate & Drug Addition"
Cohesion: 0.31
Nodes (9): addToDispensa(), checkDuplicatePrincipio(), initModals(), Modal: Add Drug to Dispensa, Modal: Safety Alert (centered), openModal() / closeModal(), showSafetyAlert(), Safety Clinical Check Module (PRD §3.4) (+1 more)

### Community 3 - "Therapy Cycles & Adherence"
Cohesion: 0.60
Nodes (5): adherencePercent(), logDose(), Modal: Add Ciclo, renderCure(), Cicli & Aderenza Terapeutica Module (PRD §3.5)

### Community 4 - "Navigation & Screen Routing"
Cohesion: 0.40
Nodes (5): navigate(screenId), renderHome(), Screen: Cicli di Cura, Screen: Dispensa, Screen: Home

### Community 5 - "App Architecture & PRD"
Cohesion: 0.50
Nodes (4): ScanMed Application, index.html (Single-File App), PRD ScanMed, Single-File Architecture Rationale

### Community 6 - "CSS Theming & UI Utilities"
Cohesion: 0.67
Nodes (3): CSS Custom Properties (:root), Expiry Status Color Coding (safe/warning/expired), Utility Functions (uid, today, getExpiryStatus, daysUntilExpiry, showToast)

## Knowledge Gaps
- **12 isolated node(s):** `PRD ScanMed`, `Utility Functions (uid, today, getExpiryStatus, daysUntilExpiry, showToast)`, `Dispensa Module (PRD §3.3)`, `CSS Custom Properties (:root)`, `Screen: Home` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DOMContentLoaded Init` connect `Supabase Integration & Drug Lookup` to `State Persistence & Dispensa`, `Safety Gate & Drug Addition`, `Navigation & Screen Routing`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **Why does `navigate(screenId)` connect `Navigation & Screen Routing` to `Supabase Integration & Drug Lookup`, `State Persistence & Dispensa`, `Safety Gate & Drug Addition`, `Therapy Cycles & Adherence`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `addToDispensa()` connect `Safety Gate & Drug Addition` to `State Persistence & Dispensa`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `navigate(screenId)` (e.g. with `Screen: Cicli di Cura` and `Screen: Dispensa`) actually correct?**
  _`navigate(screenId)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PRD ScanMed`, `Utility Functions (uid, today, getExpiryStatus, daysUntilExpiry, showToast)`, `Dispensa Module (PRD §3.3)` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
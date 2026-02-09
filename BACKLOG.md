# MilkMap Backlog

This is a simple task queue for future work. Add tasks here and Antigravity can pick them up.

## Format
```
## [PRIORITY] Task Title
- **Status**: TODO | IN_PROGRESS | DONE
- **Description**: Brief description
- **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2
```

---

## Next Up (Prioritized)

### [P1] Replace Sample Data with Real Locations
- **Status**: TODO
- **Description**: Replace the 3 sample locations with real nursing/baby-care room data for Singapore malls and attractions
- **Acceptance Criteria**:
  - [ ] At least 10 real locations added to `data/locations.json`
  - [ ] Sample data removed or moved to separate file
  - [ ] All locations have valid lat/lng coordinates
  - [ ] Sources documented for each location
  - [ ] Data validation passes

### [P1] Test GitHub Issue Integration
- **Status**: TODO
- **Description**: Set up GitHub token and test feedback/submission flows
- **Acceptance Criteria**:
  - [ ] `.env.local` created with GitHub token
  - [ ] Submit test feedback via map - should create GitHub Issue
  - [ ] Submit test location via form - should create GitHub Issue
  - [ ] Issues have correct labels ("feedback", "submission")
  - [ ] Issue templates are properly formatted

### [P2] Implement Data Scraping Scripts
- **Status**: TODO
- **Description**: Complete the placeholder scraping scripts to actually fetch data from target websites
- **Acceptance Criteria**:
  - [ ] `scrape-sgnursingrooms.ts` fetches real data
  - [ ] `scrape-momspumphere.ts` fetches real data
  - [ ] `scrape-nparks.ts` fetches real data
  - [ ] `merge-candidates.ts` successfully deduplicates
  - [ ] Confidence scoring works as expected

---

## Backlog (Future)

### [P2] Add Map Clustering
- **Status**: TODO
- **Description**: When zoomed out, cluster nearby markers to avoid clutter
- **Acceptance Criteria**:
  - [ ] Markers cluster when zoomed out
  - [ ] Clusters show count
  - [ ] Clusters expand on click
  - [ ] Works on mobile

### [P2] Add User Location
- **Status**: TODO
- **Description**: Show user's current location on map and sort list by distance
- **Acceptance Criteria**:
  - [ ] "Use my location" button in UI
  - [ ] Blue dot shows user location on map
  - [ ] List sorted by distance (nearest first)
  - [ ] Handles permission denied gracefully

### [P1] Add Empty States & Loading Skeletons
- **Status**: TODO
- **Description**: Improve UX with proper empty states and loading indicators throughout the app
- **Acceptance Criteria**:
  - [ ] No search results: Show friendly message + clear filters button
  - [ ] Map error: Show error message with retry button (already done)
  - [ ] Location permission denied: Show explanation + manual search option
  - [ ] Loading skeletons for location list while data loads
  - [ ] Empty location detail state if data missing

### [P2] Enhance Contribution Flow
- **Status**: TODO
- **Description**: Add "Suggest an edit" and "Report closed" features alongside existing "Add room"
- **Acceptance Criteria**:
  - [ ] "Suggest an edit" button in location detail drawer
  - [ ] "Report closed" button in location detail drawer
  - [ ] Both create GitHub Issues with appropriate labels
  - [ ] Pre-fill forms with current location data for edits
  - [ ] Can be stubbed (just create issue, don't auto-update data)

### [P3] Add Analytics
- **Status**: TODO
- **Description**: Track which locations are viewed most, search queries, etc.
- **Acceptance Criteria**:
  - [ ] Privacy-friendly analytics (no PII)
  - [ ] Track: location views, searches, feedback submissions
  - [ ] Simple dashboard for maintainers
  - [ ] GDPR compliant

---

## Completed

### [P1] Add Trust & Verification Indicators ✅
- **Status**: DONE (2026-02-09)
- **Description**: Show verification badges, last updated dates, and data sources
- **Solution**: Created 3 reusable components (TrustBadge, LastUpdated, SourceInfo) and integrated into LocationList and LocationDetail. Updated sample data to showcase different verification states.

### [P0] Fix Map Display Bug ✅
- **Status**: DONE (2026-02-09)
- **Description**: Map was stuck in loading state, never showing
- **Solution**: Changed from conditional rendering to always-rendered container with loading overlay
- **PR**: N/A (fixed in initial implementation)

### [P0] Build MilkMap MVP ✅
- **Status**: DONE (2026-02-09)
- **Description**: Create functional MVP with map, search, filters, feedback, and submission features
- **Solution**: Next.js + Leaflet + OpenStreetMap + GitHub Issues integration
- **PR**: N/A (initial implementation)

---

## Quick Add Section

<!-- Add new tasks here quickly, I'll organize them later -->
- Add Google Maps links to the locations so user can find
- Create larger database of the nursing rooms (I can share the excel sheet or whatever works best for Antigravity, please check with me)
- Make it easily visible on mobile
“Use my location” button + “nearest first” sort (even if approximate).

Details drawer (tap/click location → clear, readable details + amenities).

Contribution flow: “Add room” + “Suggest an edit” + “Report closed” (edit/report can be stubbed).

Trust cues: show “verified/unverified” meaning, last-updated date, and “source” if scraped.

Empty states everywhere: no results, map error, missing permissions, loading skeletons.

Mobile layout: map/list toggle or bottom sheet (V1 should still be usable on phone).



<!-- Example:
### Title
- Brief description
- Why it's needed
- Expected outcome
-->

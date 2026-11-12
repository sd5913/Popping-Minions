# The Next Stop — Level Design Document

**Project:** The Next Stop  
**Team:** Popping Minions  
**Course:** SD5913 Group Project 2026  
**Genre:** Gesture-Controlled Narrative Runner  
**Platform:** Web Browser (Desktop First)  
**Game Style:** 2.5D Narrative Adventure  
**Status:** Proposed Level and Interaction Design

---

## 1. Game Overview

**The Next Stop** is a camera-based interactive narrative runner about a young person who misses an important examination and discovers that failure does not mean the end of their journey.

Players control the protagonist through hand gestures captured by a webcam. They run through surreal environments, avoid obstacles, interact with NPCs, collect items, solve environmental challenges, and make narrative choices.

**Core Message:** Failure is not the end. Sometimes, it leads to another path.

**Core Gameplay Loop:**

Run → Avoid Obstacles → Meet NPCs → Collect Items → Solve Challenges → Discover New Routes → Progress Through the Story

## 2. Core Controls and Interactions

The game uses three main hand gestures for an accessible and consistent control system.

| Hand Gesture | Player Action | Gameplay Function |
|---|---|---|
| Move hand left/right | Change lanes | Avoid obstacles, select routes |
| Raise hand quickly | Jump | Cross gaps and avoid barriers |
| Pinch thumb and index finger | Interact / Confirm | Talk to NPCs, collect and use items |

### Interaction Modes

**Running Mode**
- The character runs forward automatically.
- Players control lane switching and jumping.
- Obstacles require quick reactions and timing.

**Dialogue Mode**
- The character stops automatically near an interactive NPC.
- Players move their hand left or right to select dialogue options.
- A pinch gesture confirms the selected response.
- Running resumes after the interaction.

**Item Interaction Mode**
- Players collect items during NPC encounters.
- Items are stored in a simple inventory.
- At designated locations, players use a pinch gesture to activate the required item.

The game should provide immediate visual feedback for every gesture.

## 3. Level Structure

The game contains a prologue, four main chapters, and an epilogue.

| Level | Environment | Main Gameplay | Narrative Theme |
|---|---|---|---|
| Prologue | Reality / Train Station | Basic controls | Fear of being late |
| Chapter 1 | The Standard Answer Avenue | Obstacles, jumping, paper bridge | Mistakes are not the end |
| Chapter 2 | Everyone's Own Pace | Cycling, route selection, NPC interaction | Everyone moves differently |
| Chapter 3 | After the Fall | Falling, repairing bridges, alternative paths | Recovering from failure |
| Chapter 4 | A River Without a Route | Boat navigation, item reuse | Choosing a new direction |
| Epilogue | Reality / Train Station | Final player choice | Moving forward |

**Target Full Experience:** Approximately 7–9 minutes.

---

## 4. Detailed Level Design

### Prologue — Don't Be Late

**Environment:** A realistic train station with a cool grey-blue color palette.

**Story:** The protagonist is rushing to an important examination. While searching for the correct train, they enter a mysterious carriage.

**Gameplay:**
1. Introduce the character and story objective.
2. Activate the webcam and calibrate hand tracking.
3. Teach basic left/right movement.
4. Enter the train and trigger the first world transition.

**Goal:** Introduce the story and basic gesture controls.

### Chapter 1 — The Standard Answer Avenue

**Environment:** A geometric city with examination-paper roads, ruler-shaped buildings, pencil obstacles, repeating gates, and a giant clock.

**Theme:** There is more than one correct answer.

**Gameplay Flow:**
1. Run forward along a three-lane road.
2. Move left or right to avoid pencil obstacles.
3. Jump over broken road sections.
4. Approach an NPC carrying documents.
5. Use a pinch gesture to start a conversation.
6. Receive a folded examination paper.
7. Reach a blocked road.
8. Use the paper to create a bridge.
9. Cross the bridge and enter the next chapter.

**NPC:** A hurried traveller.

**Sample Dialogue:**
- NPC: "Are you in a hurry too?"
- Player: "Yes. I'm afraid I'll be late."
- NPC: "The road ahead is broken. Maybe this paper can help."

**Collectible Item:** Folded Examination Paper

**Item Function:** Unfolds into a temporary paper bridge.

**Special Mechanic:** Falling from the main road can reveal a lower alternative route instead of causing a Game Over.

**Level Goal:** Teach movement, jumping, NPC interaction, item collection, and item usage.

### Chapter 2 — Everyone's Own Pace

**Environment:** A colorful hand-drawn countryside with bicycle paths, fields, windmills, and small houses.

**Theme:** Everyone has their own pace and destination.

**Gameplay Flow:**
1. The protagonist begins cycling automatically.
2. Players switch lanes to avoid rocks and barriers.
3. Jump over small obstacles.
4. Meet an NPC delivering bread by bicycle.
5. Start a conversation using a pinch gesture.
6. Receive a paper bread bag.
7. Reach a fork with two possible routes.
8. Choose between a fast, difficult road and a slower, safer road.
9. Both routes eventually lead to the next chapter.

**NPC:** A bicycle delivery rider.

**Sample Dialogue:**
- Player: "Why are you riding so slowly?"
- NPC: "I used to take the fastest road."
- Player: "What changed?"
- NPC: "I found another way that works better for me."

**Collectible Item:** Paper Bread Bag

**Item Function:** Saved for use in Chapter 4.

**Special Mechanic:** Two alternative routes with different obstacle patterns.

**Level Goal:** Encourage meaningful route selection rather than simply running as fast as possible.

### Chapter 3 — After the Fall

**Environment:** A surreal city featuring broken roads, floating staircases, tilted doors, and fragmented clocks.

**Theme:** A mistake can lead to an unexpected opportunity.

**Gameplay Flow:**
1. Run through increasingly unstable platforms.
2. Avoid falling objects and jump across gaps.
3. Reach a large broken section of road.
4. Falling leads to a lower pathway rather than ending the game.
5. Meet an NPC repairing a bridge.
6. Talk to the NPC and receive repair tape.
7. Approach a damaged bridge.
8. Pinch and hold to activate the repair process.
9. The bridge reconnects, creating a new path.
10. Cross the repaired bridge and continue.

**NPC:** A bridge repairer.

**Sample Dialogue:**
- Player: "I fell. I can't get back."
- NPC: "Maybe you don't need to."
- Player: "But the bridge is broken."
- NPC: "Then let's fix it together."

**Collectible Item:** Repair Tape

**Item Function:** Repairs a damaged bridge.

**Special Mechanic:** Failure opens an alternative route, while item interaction changes the environment.

**Level Goal:** Let players experience recovery and progress through direct action.

### Chapter 4 — A River Without a Route

**Environment:** A dreamlike river with floating islands, gentle currents, and multiple possible shorelines.

**Theme:** Moving forward does not always mean going straight.

**Gameplay Flow:**
1. The protagonist enters a small boat.
2. Players move left and right to avoid floating obstacles.
3. Water currents cause temporary sideways movement.
4. Meet an NPC travelling on another boat.
5. The NPC suggests using an existing item.
6. Select the Paper Bread Bag collected in Chapter 2.
7. Use a pinch gesture to transform the bag into a small paper sail.
8. Navigate toward one of two available shorelines.
9. Reach the exit and return to reality.

**NPC:** A traveller on the river.

**Sample Dialogue:**
- Player: "How do I reach the shore?"
- NPC: "Not every path goes straight ahead."
- Player: "Then how should I turn?"
- NPC: "Maybe you already have something that can help."

**Required Item:** Paper Bread Bag

**Item Function:** Becomes a paper sail that helps the player change direction.

**Special Mechanic:** Reuse an item collected in an earlier chapter.

**Level Goal:** Connect previous choices to later gameplay and encourage independent decision-making.

### Epilogue — The Next Step

**Environment:** The original train station, now with softer and warmer lighting.

**Story:** The protagonist returns to reality and discovers that the examination has already started. Entry is no longer possible.

For the first time, the character stops running automatically.

**Gameplay Flow:**
1. The train arrives at the station.
2. The protagonist receives the missed-examination notification.
3. The player performs a deliberate hand gesture to leave the train.
4. A message from a friend appears.
5. The player chooses a final response.

**Ending A — Try Again**

"I missed it. I'll look for another opportunity."

The protagonist walks toward a different street.

**Ending B — Take a Break**

"I missed it. Let's have dinner tonight."

The protagonist enters a small restaurant and rests.

Neither ending is presented as a failure.

**Final Message:**

*"I missed this stop. What comes next?"*

---

## 5. NPC and Item System

NPC interactions should be short, meaningful, and directly connected to gameplay progression.

| Chapter | NPC | Item | Gameplay Purpose |
|---|---|---|---|
| 1 | Hurried Traveller | Folded Examination Paper | Create a bridge |
| 2 | Bicycle Delivery Rider | Paper Bread Bag | Become a sail in Chapter 4 |
| 3 | Bridge Repairer | Repair Tape | Repair a broken bridge |
| 4 | River Traveller | Item-use hint | Help the player use a previous item |

**Design Rule:** Every important item should have a clear gameplay purpose rather than being a decorative collectible.

## 6. Failure and Progression

The main design principle is **Fail Forward**.

Instead of restarting the level after every mistake:

- Minor collisions cause temporary movement feedback.
- Falling may reveal a lower alternative path.
- Difficult routes may provide safer recovery options.
- Players can retry an interaction without restarting the chapter.
- Major narrative progress is saved at checkpoints.

Failure should influence the player's journey without preventing progression.

## 7. Visual Design Principles

All chapters share three consistent visual elements:

1. **Orange-red backpack:** The protagonist remains recognizable across different art styles.
2. **Forward perspective:** Roads, bridges, and rivers lead toward a central vanishing point.
3. **Circular motifs:** Clocks, wheels, tunnels, and water ripples connect the different worlds.

Each chapter has a distinct visual atmosphere while maintaining consistent character design and navigation rules.

## 8. Technical Implementation

**Planned Technology:**
- HTML5 Canvas for 2.5D game rendering.
- JavaScript for game logic and event handling.
- CSS for menus, dialogue, and interface elements.
- MediaPipe Hand Landmarker or equivalent hand-tracking technology for webcam input.

**Core Systems:**
1. Hand gesture detection and input calibration.
2. Three-lane running and jumping.
3. Obstacle collision and checkpoint recovery.
4. NPC dialogue and choice selection.
5. Inventory and item interaction.
6. Level events and scene transitions.
7. Narrative progression and ending selection.

**Interaction Requirements:**
- Single-hand control where possible.
- Stable gesture recognition with input smoothing.
- Clear visual feedback for successful inputs.
- Pause or recovery when hand tracking is lost.
- Keyboard fallback for testing and accessibility.

## 9. Development Priorities

### Phase 1 — Core Playable Prototype

Complete Chapter 1 as a fully interactive gameplay loop.

- [ ] Camera-based left/right movement
- [ ] Gesture-controlled jumping
- [ ] Functional obstacle avoidance
- [ ] NPC interaction and dialogue
- [ ] Dialogue option selection
- [ ] Item collection
- [ ] Item usage and bridge creation
- [ ] Alternative route after failure
- [ ] Chapter completion and transition

### Phase 2 — Expanded Narrative Gameplay

- [ ] Chapter 2 route selection
- [ ] Chapter 3 bridge repair
- [ ] Chapter 4 boat navigation
- [ ] Cross-chapter inventory
- [ ] Environmental transitions
- [ ] Two narrative endings

### Phase 3 — Polish and Testing

- [ ] Hand-tracking accuracy testing
- [ ] Gameplay difficulty balancing
- [ ] NPC dialogue timing
- [ ] Visual and audio feedback
- [ ] Browser compatibility testing
- [ ] Player usability testing

## 10. Design Goal

**The Next Stop** aims to connect physical interaction with emotional storytelling.

Each gesture supports both gameplay and narrative meaning:

- **Moving left and right:** Exploring different possibilities.
- **Jumping:** Overcoming obstacles and uncertainty.
- **Interacting:** Connecting with others and discovering help.
- **Using items:** Creating new opportunities.
- **Taking the final step:** Choosing to move forward.

The player's journey gradually changes from following a fixed destination to discovering their own direction.

**The game is not about reaching the finish line as quickly as possible. It is about discovering that there is always another way forward.**

---

*This document describes the proposed level design and planned interactions. Implementation progress should be recorded separately in `docs/PROGRESS.md`.*
# Development Progress Log

**Project:** The Next Stop  
**Team:** Popping Minions  
**Course:** SD5913 — Group Project 2026

This document records our weekly development progress, decisions, challenges, tutor feedback, and next steps.

---

## Week 1 — 5 November 2026

### Weekly Goal

Establish the narrative concept and development scope, and begin prototyping the first playable interaction.

### Completed Work

- Developed the initial narrative structure, including the prologue, four chapters, and epilogue.
- Defined the core design principle: **Failure is not the end.**
- Identified planned movement mechanics, gesture controls, and visual guidelines.
- Began exploring visual concepts for different game environments.
- Created the initial English game concept document in the shared GitHub repository.
- Implemented the first browser-based interactive prototype using HTML5 Canvas and JavaScript.
- Created a simplified 2.5D station environment and a character with an orange-red backpack.
- Implemented three-lane movement using the left and right arrow keys.
- Implemented continuous road-marking animation using requestAnimationFrame() to simulate forward movement.
- Maintained keyboard-controlled lane switching during the animation.

### Development Evidence

- [Game Concept Document](GAME_CONCEPT.md)
- Initial documentation commit: `551f302`
- Concept art: In progress; links will be added after assets are uploaded.

### Current Challenges

- Translating the narrative concept into a feasible interactive prototype.
- Establishing a consistent gameplay system across different environments.
- Evaluating gesture recognition for reliable player input.

### Testing

**Initial Interaction Test — 5 November 2026**

Tested the prototype locally in a web browser.

- The game canvas displayed successfully.
- The protagonist appeared in the station environment.
- Left and right arrow keys successfully changed the character's lane.

**Result:** Basic keyboard-controlled movement works.

**Limitations:** Automatic running, obstacles, jumping, collision detection, and gesture recognition have not yet been implemented.

External playtesting has not yet been conducted.

**Animation Test — 5 November 2026**

- Confirmed that the road markings animate continuously.
- Verified that the player can still switch lanes during animation.

**Result:** The initial forward-motion effect works locally.

**Limitation:** The prototype does not yet include moving obstacles, collision detection, or actual character running animations.

### Tutor Feedback

To be completed after the tutorial meeting.

### Next Steps

- Implement basic player movement.
- Add obstacles and collision feedback.
- Prototype continuation through an alternative path after a mistake.
- Test the interaction and document the results.

### Task Ownership

Individual responsibilities will be added after confirmation with the team.

### AI Assistance

AI was used to assist with the structure and English drafting of project documentation. The team is responsible for reviewing and validating the content. AI assistance during coding and asset development will be documented as it occurs.

AI also assisted in drafting the initial HTML Canvas prototype and keyboard movement code. The implementation was tested locally by a team member.

AI assisted with implementing the Canvas animation loop and road-marking movement. The functionality was tested locally by a team member.
### Moving Obstacle Prototype — 5 November 2026

**Implemented**
- Added a pencil-shaped obstacle to the 2.5D road.
- Implemented perspective scaling as the obstacle approaches.
- Used frame-time-based animation for obstacle movement.

**Local Testing**
- Confirmed that the yellow obstacle appears correctly.
- Verified that the obstacle moves toward the player and repeats.
- Confirmed that keyboard lane switching still works.

**Current Limitations**
- The obstacle currently stays in the center lane.
- Collision detection and alternative routes are not yet implemented.

**AI Assistance**
AI assisted with drafting and modifying the obstacle animation code. The resulting interaction was tested locally by a team member.

### Collision Detection Prototype — 5 November 2026

**Implemented**
- Added basic collision detection for the approaching pencil obstacle.
- Added visual feedback: "Hit! Keep going."
- Designed collisions to allow continued gameplay without a Game Over screen.

**Local Testing**
- Confirmed that collision feedback appears when the player remains in the center lane.
- Verified the initial collision interaction in the browser.

**Current Limitations**
- Collision detection is based on obstacle progress and lane position.
- Falling onto an alternative route has not yet been implemented.
- Further testing is needed for different movement timings.

**AI Assistance**
AI assisted with drafting the collision detection logic and integrating visual feedback. The prototype was tested locally by a team member.

**Next Step**
Implement the alternative-path mechanism so that a collision can lead to a different route instead of restarting the game.


### Alternative Route Prototype — 5 November 2026

**Implemented**
- Added a transition from the main road to a lower route after collision.
- Added a short falling animation.
- Changed the road appearance to indicate the alternative route.
- Allowed the player to continue moving without restarting.

**Local Testing**
- Verified the falling transition after collision.
- Confirmed that the lower route appears.
- Confirmed that keyboard movement continues on the alternative route.
- No Game Over screen is triggered.

**Current Limitations**
- The lower route uses a simplified visual representation.
- Additional obstacles and narrative events are not yet implemented.

**AI Assistance**
AI assisted with implementing the route state transitions and falling animation. The interaction was tested locally by a team member.

**Next Step**
Add automated code checks using GitHub Actions.


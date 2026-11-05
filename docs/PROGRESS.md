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

### Automated Code Checks — 5 November 2026

**Implemented**
- Created a GitHub Actions workflow for automated code checks.
- Configured checks for pushes to main and pull requests.
- Added required-file verification and JavaScript syntax checking.

**Testing**
- Successfully triggered the first GitHub Actions workflow.
- Confirmed that the first workflow run completed with a green Success status.
- Verified that the automated checks passed.

**Current Limitations**
- The workflow currently checks file existence and JavaScript syntax.
- Gameplay behaviour and collision logic are not yet automatically tested.

**AI Assistance**
AI assisted with drafting and configuring the GitHub Actions workflow.

**Next Step**
Continue developing the interactive gameplay and introduce automated gameplay tests where appropriate.
### Jump Animation Prototype — 5 November 2026

**Implemented**
- Added Space-key input for jumping.
- Implemented a vertical jump animation.
- Added automatic landing after each jump.
- Preserved lane switching and existing road animations.

**Local Testing**
- Confirmed that pressing Space triggers a visible jump.
- Verified that the character returns to the ground.
- Confirmed that lane switching and obstacle animations still work.

**Current Limitations**
- Jumping does not yet prevent obstacle collisions.
- Jump timing and collision avoidance still need testing.

**AI Assistance**
AI assisted with implementing the jump animation and keyboard input. The functionality was tested locally by a team member.

**Next Step**
Connect jumping to collision detection so players can avoid obstacles.

---

## End-of-Day Summary — 5 November 2026

### Overall Progress

Today, we progressed from the initial game concept to a functioning browser-based interaction prototype.

**Completed Milestones**

- Established the narrative concept, core gameplay direction, and initial project scope.
- Developed a simplified 2.5D station environment using HTML5 Canvas and JavaScript.
- Implemented three-lane keyboard movement.
- Added continuous road animation to simulate forward movement.
- Created a perspective-scaled, moving pencil obstacle.
- Implemented basic collision detection and visual feedback.
- Added an alternative-route transition after collision, allowing the player to continue instead of restarting.
- Implemented keyboard-controlled jumping and automatic landing.
- Configured GitHub Actions for basic automated code checks.

### Testing and Validation

Local browser testing confirmed that:

- Keyboard-controlled lane switching works.
- Road and obstacle animations run continuously.
- Collision feedback is displayed.
- The player can transition to an alternative route and continue moving.
- The jump animation responds to the Space key.

The initial GitHub Actions workflow also completed successfully.

### Current Limitations

- Jumping is not yet connected to obstacle collision avoidance.
- The lower route remains a simplified prototype.
- Gesture recognition has not yet been integrated.
- Visual assets and narrative scenes are still under development.
- External playtesting has not yet been conducted.
- Automated gameplay behaviour tests have not yet been implemented.

### Next Development Priorities

1. Connect jump timing to collision detection.
2. Improve obstacle avoidance and route transitions.
3. Introduce additional visual assets and narrative elements.
4. Begin testing gesture-based controls.
5. Prepare an integrated core experience for the 12 November tutor review.

### Development Evidence

- Repository: https://github.com/sd5913/Popping-Minions
- Latest verified commit: `3dd224e`
- CI configuration commit: `dff36d2`
- Detailed implementation and testing notes are recorded in the milestone entries above.

### AI Assistance and Reflection

AI assisted with code drafting, debugging guidance, documentation, and GitHub Actions configuration. The implemented interactions were tested locally by a team member.

The main achievement of this development session was demonstrating the core narrative idea through interaction: a mistake can lead to a different path rather than ending the journey.

Further development will focus on improving the interaction quality and integrating the narrative experience.

export const CHAPTERS = [
  {
    id: "prologue",
    name: "Can't Be Late",
    label: "PROLOGUE",
    duration: 22,
    speed: 0.42,
    spawnInterval: 1.8,

    colors: {
      skyTop: "#34495f",
      skyBottom: "#e2a16e",
      road: "#526173",
      roadLine: "#d9c9a5",
      accent: "#e8a06b",
      building: "#526477"
    },

    obstacleTypes: ["luggage", "barrier"],

    description:
      "A morning train. A journey that should have been simple.",

    dialogue: null
  },

  {
    id: "chapter-1",
    name: "Standard Answer Avenue",
    label: "CHAPTER 01",
    duration: 32,
    speed: 0.58,
    spawnInterval: 1.65,

    colors: {
      skyTop: "#aaa99a",
      skyBottom: "#e6d9b9",
      road: "#b8ae99",
      roadLine: "#f1d943",
      accent: "#e8d43e",
      building: "#77766e"
    },

    obstacleTypes: ["pencil", "gate", "block"],

    description:
      "A road that looks like an answer sheet.",

    dialogue: [
      {
        speaker: "TRAVELLER",
        text: "Where are you going?"
      },
      {
        speaker: "YOU",
        text: "To the exam. I can't be late."
      },
      {
        speaker: "TRAVELLER",
        text: "Do you know where this road leads?"
      },
      {
        speaker: "YOU",
        text: "Everyone is running this way."
      }
    ]
  },

  {
    id: "chapter-2",
    name: "Everyone's Own Pace",
    label: "CHAPTER 02",
    duration: 32,
    speed: 0.53,
    spawnInterval: 1.9,

    colors: {
      skyTop: "#9bc4d1",
      skyBottom: "#f4d9a5",
      road: "#c5a878",
      roadLine: "#f4e8c9",
      accent: "#91a96f",
      building: "#b7a58a"
    },

    obstacleTypes: ["crate", "cart", "rock"],

    description:
      "The railway becomes a road through the countryside.",

    dialogue: [
      {
        speaker: "YOU",
        text: "Are you in a hurry too?"
      },
      {
        speaker: "CYCLIST",
        text: "Yes. The bread gets cold."
      },
      {
        speaker: "YOU",
        text: "Then why are you riding so slowly?"
      },
      {
        speaker: "CYCLIST",
        text: "That corner is rough. I don't want to crush the bread."
      }
    ]
  },

  {
    id: "chapter-3",
    name: "After the Mistake",
    label: "CHAPTER 03",
    duration: 32,
    speed: 0.61,
    spawnInterval: 1.8,

    colors: {
      skyTop: "#351d2a",
      skyBottom: "#793e42",
      road: "#392e32",
      roadLine: "#b97865",
      accent: "#f1b66b",
      building: "#211d25"
    },

    obstacleTypes: ["broken-road", "door", "falling-block"],

    description:
      "The road breaks. Another way appears below.",

    dialogue: [
      {
        speaker: "YOU",
        text: "I fell down."
      },
      {
        speaker: "BRIDGE BUILDER",
        text: "I saw."
      },
      {
        speaker: "YOU",
        text: "I can't get back to the road above."
      },
      {
        speaker: "BRIDGE BUILDER",
        text: "Then help me hold this."
      }
    ]
  },

  {
    id: "chapter-4",
    name: "A River Without a Route",
    label: "CHAPTER 04",
    duration: 32,
    speed: 0.36,
    spawnInterval: 2.5,

    colors: {
      skyTop: "#92b9ce",
      skyBottom: "#e6c3c3",
      road: "#679bad",
      roadLine: "#c9e5df",
      accent: "#e5b8a9",
      building: "#8babb9"
    },

    obstacleTypes: ["island", "driftwood", "rock"],

    description:
      "The road becomes a river. The current takes another direction.",

    dialogue: [
      {
        speaker: "YOU",
        text: "Will this river take me to the exam?"
      },
      {
        speaker: "TRAVELLER",
        text: "I don't know. I'm going downstream."
      },
      {
        speaker: "YOU",
        text: "I might already be late."
      },
      {
        speaker: "TRAVELLER",
        text: "There is a place to get ashore ahead."
      }
    ]
  },

  {
    id: "epilogue",
    name: "Missed This Stop",
    label: "EPILOGUE",
    duration: 18,
    speed: 0.15,
    spawnInterval: 99,

    colors: {
      skyTop: "#52677a",
      skyBottom: "#e5bd8d",
      road: "#77828a",
      roadLine: "#e8d6ae",
      accent: "#e9b77d",
      building: "#657b8c"
    },

    obstacleTypes: [],

    description:
      "The train stops. This time, you decide to move.",

    dialogue: [
      {
        speaker: "PHONE",
        text: "The exam has already started."
      },
      {
        speaker: "FRIEND",
        text: "Finished the exam? Want to eat together tonight?"
      },
      {
        speaker: "YOU",
        text: "I didn't make it."
      },
      {
        speaker: "FRIEND",
        text: "Then shall we eat a little earlier?"
      }
    ]
  }
];

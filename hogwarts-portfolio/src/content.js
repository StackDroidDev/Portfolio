export const content = {
  name: "Joel Biju",
  role: "App Developer • Photographer",
  email: "rqf.odyssey@gmail.com",
  github: "https://github.com/StackDroidDev",
  linkedin: "https://www.linkedin.com/in/stackdroiddev",
  education: "BTech CSE (AI/ML) at NST Pune; St. Joseph School, Bhopal till 2025",
  interests: "apps, singing, video and music editing, photography",
  navigationHint: "Scroll to meet the Sorting Hat",
  loading: {
    platform: "Platform 9¾",
    enter: "Enter",
    skip: "Skip"
  },

  // --- PART 2: SORTING CEREMONY & GREAT HALL ---
  sortingHat: {
    initialSpeech: "Hmm... a new visitor. Let me see...",
    subsequentSpeech: "Ah, welcome back. Still feeling true to your house, or shall we sort you anew?",
    btnDecide: "Let the hat decide",
    btnChoose: "I know my house",
    btnChangeHouse: "Change house",
    btnSkip: "Skip ceremony",
    quiz: [
      {
        question: "Which mystical light draws your path forward?",
        options: [
          { text: "A blazing candle in the dark", houses: { gryffindor: 2, hufflepuff: 1 } },
          { text: "A flash of crackling lightning", houses: { slytherin: 2, gryffindor: 1 } },
          { text: "The serene glow of the full moon", houses: { ravenclaw: 2, slytherin: 1 } }
        ]
      },
      {
        question: "Choose a companion for the long journey:",
        options: [
          { text: "A keen-eyed screech owl", houses: { ravenclaw: 2, gryffindor: 1 } },
          { text: "A sleek, quiet midnight cat", houses: { slytherin: 2, ravenclaw: 1 } },
          { text: "An honest, earthbound toad", houses: { hufflepuff: 2, gryffindor: 0 } }
        ]
      },
      {
        question: "Which innate virtue echoes deepest within you?",
        options: [
          { text: "Unyielding courage in adversity", houses: { gryffindor: 3, hufflepuff: 0 } },
          { text: "Sharp cleverness and vision", houses: { ravenclaw: 2, slytherin: 2 } },
          { text: "Loyal kindness and perseverance", houses: { hufflepuff: 3, ravenclaw: 0 } }
        ]
      }
    ],
    crests: [
      {
        id: "gryffindor",
        name: "Gryffindor",
        symbol: "Lion",
        subtitle: "Bravery & Chivalry",
        accent: "#d13636"
      },
      {
        id: "slytherin",
        name: "Slytherin",
        symbol: "Serpent",
        subtitle: "Ambition & Resourcefulness",
        accent: "#2e8b57"
      },
      {
        id: "ravenclaw",
        name: "Ravenclaw",
        symbol: "Eagle",
        subtitle: "Wisdom & Wit",
        accent: "#3878c7"
      },
      {
        id: "hufflepuff",
        name: "Hufflepuff",
        symbol: "Badger",
        subtitle: "Loyalty & Dedication",
        accent: "#d69e2e"
      }
    ]
  },

  greatHall: {
    welcomeTitle: "The Great Hall",
    introStatement: "Welcome. I turn ideas into apps, and moments into photographs.",
    scrollContinue: "Scroll to explore"
  },

  // --- PART 3: DIVINATION & GRAND STAIRCASE TIMELINE ---
  divination: {
    intro: "Let me look into the crystal and see who Joel is.",
    instructions: "Choose an orb or use Tab/Enter to divine the past, present, and creative spirit.",
    crystals: [
      {
        id: "student",
        title: "The Student",
        subtitle: "Foundations & Academic Lore",
        lines: [
          "Shaped by foundational discipline at St. Joseph School, Bhopal till 2025.",
          "Pursuing BTech CSE in Artificial Intelligence and Machine Learning at NST Pune.",
          "Bridging foundational algorithmic rigor with exploratory modern engineering."
        ]
      },
      {
        id: "developer",
        title: "The Developer",
        subtitle: "Code Alchemist & Systems",
        lines: [
          "Commenced codecraft in 2022 with Python, forging logic into working reality.",
          "Constructed EDITH in 2023, an autonomous AI agent for personal workflow automation.",
          "Engineered low-level foundations in C/C++ in 2024, expanding into native Android app development in 2026."
        ]
      },
      {
        id: "creator",
        title: "The Creator",
        subtitle: "Light, Lenses & Soundscapes",
        lines: [
          "Preserving fleeting emotion through intentional natural-light photography.",
          "Crafting visual stories with rhythm in video cinematography and post-production.",
          "Expressing melodic harmony through vocal singing and music editing."
        ]
      }
    ]
  },

  timeline: {
    title: "The Grand Staircase",
    subtitle: "Chronicles of Knowledge & Milestones",
    milestones: [
      {
        year: "2022",
        title: "The First Spark",
        desc: "Started coding with Python, discovering the power of automated logic and syntax."
      },
      {
        year: "2023",
        title: "Birth of EDITH",
        desc: "Engineered EDITH, an AI agent capable of contextual assistance and task automation."
      },
      {
        year: "2024",
        title: "Low-Level Mastery",
        desc: "Completed Harvard's foundational coursework in C, expanding deeper into memory & C++."
      },
      {
        year: "2025",
        title: "Schooling Threshold",
        desc: "Concluded high school milestones at St. Joseph School, Bhopal."
      },
      {
        year: "2026",
        title: "NST Pune & Android Architecture",
        desc: "Enrolled in BTech CSE (AI/ML) at NST Pune; initiated native Android app engineering."
      }
    ]
  }
};
export interface DemoScenario {
  id: string;
  label: string;
  prompt: string;
}

export const demoScenarios: DemoScenario[] = [
  {
    id: "laptop-university",
    label: "Laptop for university",
    prompt:
      "I need a lightweight laptop for university. I study business analytics, use Python and Power BI, and want to stay around £1,000."
  },
  {
    id: "running-shoes-marathon",
    label: "Running shoes for marathon training",
    prompt:
      "I'm training for my first marathon and need running shoes for high weekly mileage. I overpronate slightly and want good cushioning, budget under £160."
  },
  {
    id: "home-office-setup",
    label: "Home office setup",
    prompt:
      "I'm setting up a home office and need an ergonomic office chair. I sit for 8+ hours a day and have some lower back pain, budget around £500."
  },
  {
    id: "noise-cancelling-headphones",
    label: "Noise cancelling headphones",
    prompt:
      "I want noise cancelling headphones for a noisy daily commute and open-plan office, ideally with a long battery life, around £300."
  },
  {
    id: "coffee-machine-small-kitchen",
    label: "Coffee machine for small kitchen",
    prompt:
      "Looking for a coffee machine for a small kitchen with limited counter space, I like espresso-style coffee but don't want anything too complicated, under £250."
  }
];

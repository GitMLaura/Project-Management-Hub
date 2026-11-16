// Pure checks of the seed data, so mistakes show up in tests before touching the database.
import { AREAS, EPICS, FLOWS, PEOPLE, SCREENS, type SeedEpic } from "./aurora";
import { RITUALS } from "./rituals";

export function countSeed() {
  const features = EPICS.flatMap((epic) => epic.features);
  const stories = features.flatMap((feature) => feature.stories);
  const tasks = stories.flatMap((story) => story.tasks);
  return {
    epics: EPICS.length,
    features: features.length,
    stories: stories.length,
    tasks: tasks.length,
    rules: features.reduce((sum, feature) => sum + feature.rules.length, 0),
    flows: FLOWS.length,
    screens: SCREENS.length,
    rituals: RITUALS.length,
    people: PEOPLE.length,
  };
}

// Returns a list of problems (empty when the seed is consistent).
export function validateSeed(): string[] {
  const problems: string[] = [];
  const people = new Map(PEOPLE.map((person) => [person.name, person]));
  const featureKeys = new Set(EPICS.flatMap((epic) => epic.features.map((feature) => feature.key)));
  const screenKeys = new Set(SCREENS.map((screen) => screen.key));

  for (const area of AREAS) {
    const leaders = PEOPLE.filter((person) => person.area === area && person.isLeader);
    if (leaders.length !== 1) problems.push(`Area ${area} needs exactly 1 leader`);
  }
  if (PEOPLE.filter((person) => person.isOwner).length !== 1) problems.push("Exactly 1 owner is needed");

  const checkPerson = (name: string, where: string) => {
    if (!people.has(name)) problems.push(`${where}: unknown person ${name}`);
  };
  const checkOrder = (child: number, parent: number, where: string) => {
    if (child > parent) problems.push(`${where}: deadline is after its parent`);
  };

  const checkEpic = (epic: SeedEpic) => {
    checkPerson(epic.assignee, epic.title);
    for (const feature of epic.features) {
      checkPerson(feature.assignee, feature.title);
      checkOrder(feature.due, epic.due, feature.title);
      if (feature.start > feature.due) problems.push(`${feature.title}: start after deadline`);
      for (const story of feature.stories) {
        checkPerson(story.assignee, story.title);
        checkOrder(story.due, feature.due, story.title);
        if (story.start > story.due) problems.push(`${story.title}: start after deadline`);
        if (story.tasks.length === 0) problems.push(`${story.title}: story without tasks`);
        for (const task of story.tasks) {
          checkPerson(task.assignee, task.title);
          checkOrder(task.due, story.due, task.title);
        }
      }
    }
  };
  EPICS.forEach(checkEpic);

  for (const flow of FLOWS) {
    if (!featureKeys.has(flow.featureKey)) problems.push(`Flow ${flow.title}: unknown feature`);
    for (const key of Object.values(flow.links)) {
      if (!screenKeys.has(key)) problems.push(`Flow ${flow.title}: unknown screen ${key}`);
    }
  }
  for (const screen of SCREENS) {
    if (!featureKeys.has(screen.featureKey)) problems.push(`Screen ${screen.name}: unknown feature`);
  }
  for (const ritual of RITUALS) {
    ritual.participants.forEach((name) => checkPerson(name, ritual.title));
    for (const summary of ritual.summaries) {
      if (!AREAS.includes(summary.area)) problems.push(`${ritual.title}: unknown area ${summary.area}`);
      summary.pendings.forEach((pending) => checkPerson(pending.assignee, ritual.title));
    }
  }
  return problems;
}

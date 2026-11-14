import { defineComponents } from "blume";
import TaskListBoxes from "./components/TaskListBoxes.astro";

export default defineComponents({
  layout: {
    // Below every docs page: makes the checklists tickable (see the component).
    PageFooter: TaskListBoxes,
  },
});

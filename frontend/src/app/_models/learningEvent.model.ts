import {LearningActivity} from "./learningActivity.model";

export interface LearningEvent {
  _id?: any;
  LearningEvents?: string;
  LearningActivities?: LearningActivity[]
}

import { UserEnvironment } from '../user-environment/user-environments.model';
import { UserHistory } from '../user-history/user-history.model';

// A custom message type that defines the topic and the corresponding payload.
// For every module that publishes a subscription add its type def and the possible subscription type.
export type TopicDef = {
  [
    topic: `user_environment/${string}/${'created' | 'updated' | 'deleted'}`
  ]: UserEnvironment;
  [topic: `user_environment/${string}/deleted_many`]: number;
  [
    topic: `user_history/${string}/${'created' | 'updated' | 'deleted'}`
  ]: UserHistory;
  [topic: `user_history/${string}/deleted_many`]: number;
};

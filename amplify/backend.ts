import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { scheduler } from "./functions/scheduler/resource"

defineBackend({
  auth,
  data,
  scheduler
});

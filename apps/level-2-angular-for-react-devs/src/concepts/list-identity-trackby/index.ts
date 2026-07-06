import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const listIdentityTrackby = makeAngularConcept({
  slug: 'list-identity-trackby',
  title: 'View identity, @for track, and differ',
  summary: 'Angular preserves DOM and component instances in lists through explicit tracking.',
  tags: ['Angular', 'Identity', 'Lists'],
  doc,
  reactMentalModel:
    'React keys let reconciliation match siblings and preserve state across insert, delete, and reorder.',
  angularEquivalent:
    'Angular @for track / trackBy gives the iterable differ stable identity for embedded views.',
  code: `@Component({
  template: \`
    @for (user of users(); track user.id) {
      <user-row [user]="user" />
    }
  \`,
})
export class UserList {
  users = input.required<User[]>();
}`,
  bridge: [
    {
      react: 'key prop',
      angular: '@for (...; track item.id) / trackBy',
      seniorNote: 'Index tracking has the same state-loss risk as index keys in React.',
    },
    {
      react: 'preserve/remount component',
      angular: 'reuse/destroy embedded view',
      seniorNote: 'The unit of preservation is an Angular view with directives/components inside it.',
    },
    {
      react: 'reconciliation among siblings',
      angular: 'IterableDiffer operations',
      seniorNote: 'Angular computes insert/move/remove operations for the container.',
    },
  ],
  exercise: {
    prompt: 'A sorted Angular table uses @for without stable tracking and row component state jumps. Fix the identity model.',
    reactFirstThinking: [
      'This feels like React index keys.',
      'Use a stable item id.',
      'Preserve row state when order changes.',
    ],
    angularAnswer: `Use stable tracking.

\`\`\`html
@for (row of rows(); track row.id) {
  <trade-row [row]="row" />
}
\`\`\`

If the app still uses \`*ngFor\`, provide \`trackBy: trackById\`. Never track by index for mutable, sortable, filterable lists unless remounting is the desired behavior.`,
    checklist: [
      'Uses stable domain id.',
      'Explains embedded view reuse.',
      'Warns against index tracking.',
      'Mentions old *ngFor trackBy when relevant.',
    ],
  },
});

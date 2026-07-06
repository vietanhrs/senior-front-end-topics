import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const angularTemplates = makeAngularConcept({
  slug: 'angular-templates',
  title: 'Angular templates vs JSX',
  summary: 'Angular templates are compiler input, not JavaScript element objects like JSX.',
  tags: ['Angular', 'Templates', 'React map'],
  doc,
  reactMentalModel:
    'In React, JSX is JavaScript syntax that returns immutable element objects on every render.',
  angularEquivalent:
    'In Angular, the template is statically compiled into instructions that update views and bindings.',
  code: `@Component({
  selector: 'user-card',
  template: \`
    <article>
      <h3>{{ user().name }}</h3>
      <button (click)="save()">Save</button>
    </article>
  \`,
})
export class UserCard {
  user = input.required<User>();
  save = output<void>();
}`,
  bridge: [
    {
      react: 'JSX expression',
      angular: 'Component template',
      seniorNote: 'A template is compiled ahead of time; it is not a value you recreate in render.',
    },
    {
      react: 'props',
      angular: 'input() / @Input',
      seniorNote: 'Inputs define component API and participate in change detection.',
    },
    {
      react: 'event prop like onClick',
      angular: 'output() / @Output plus (click)',
      seniorNote: 'Angular separates DOM events from component outputs in the template syntax.',
    },
  ],
  exercise: {
    prompt: 'You see a React component with JSX, props, children, and an onSave callback. Describe the Angular component shape.',
    reactFirstThinking: [
      'JSX returns a tree of element objects.',
      'Props flow into the function component.',
      'Callbacks are passed as props.',
    ],
    angularAnswer: `Use a component class plus a template.

- Static markup and bindings live in \`template\` or \`templateUrl\`.
- Parent data enters through \`input()\` or \`@Input()\`.
- Child-to-parent events leave through \`output()\` or \`@Output()\`.
- Projection uses \`<ng-content>\`, not \`props.children\`.

The React analogy helps with "data down, events up", but Angular's compiler owns the template shape.`,
    checklist: [
      'Mentions template compilation.',
      'Maps props to inputs.',
      'Maps callbacks to outputs or DOM event bindings.',
      'Calls out ng-content for children/projection.',
    ],
  },
});

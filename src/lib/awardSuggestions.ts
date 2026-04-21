export type AwardSuggestion = {
	name: string;
	tagline?: string;
	multi?: boolean;
};

export type AwardSuggestionGroup = {
	theme: string;
	items: ReadonlyArray<AwardSuggestion>;
};

export const AWARD_SUGGESTIONS: ReadonlyArray<AwardSuggestionGroup> = [
	{
		theme: 'The Essentials',
		items: [
			{ name: 'Most Valuable Picture', tagline: 'the MVP' },
			{ name: 'Best Acting Performance' },
			{ name: 'Best Story' },
			{ name: 'Best Cinematography' },
			{ name: 'Best Soundtrack' },
			{ name: 'Best Visual Design' },
			{ name: 'Rookie of the Year', tagline: 'movie I watched for the first time' },
			{ name: 'Best Series', tagline: 'multi-film franchise showcase', multi: true },
			{ name: 'Best Superhero Movie' },
			{ name: 'Best World-Building' }
		]
	},
	{
		theme: 'Moments',
		items: [
			{ name: 'Best Moment' },
			{ name: 'Best Ending' },
			{ name: 'Best Twist' },
			{ name: 'Best Action' },
			{ name: 'Best Fight' },
			{ name: 'Best Shot', tagline: 'the single frame that stuck' },
			{ name: 'Best Death' }
		]
	},
	{
		theme: 'Hot Takes',
		items: [{ name: 'Most Underrated' }, { name: 'Most Overrated' }, { name: 'Most Original' }]
	}
];

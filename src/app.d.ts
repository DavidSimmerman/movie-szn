declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('$lib/server/users').PublicUser | null;
			viewUsername: string | null;
			visitorId: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

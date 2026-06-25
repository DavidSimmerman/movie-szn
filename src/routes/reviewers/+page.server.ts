import { listReviewers } from '$server/users';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ reviewers: await listReviewers() });

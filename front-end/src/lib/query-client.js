import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			// Keep data "fresh" for 2 minutes — subsequent mounts/reloads will
			// show cached data instantly and only revalidate in the background.
			staleTime: 2 * 60 * 1000,
			// Keep unused data in memory for 10 minutes before garbage collecting
			gcTime: 10 * 60 * 1000,
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});
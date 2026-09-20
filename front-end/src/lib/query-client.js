import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			// Keep data "fresh" for 1 minute — subsequent mounts/reloads will
			// show cached data instantly and only revalidate in the background.
			staleTime: 60 * 1000,
			// Keep unused data in memory for 10 minutes before garbage collecting
			gcTime: 10 * 60 * 1000,
			refetchOnWindowFocus: true,
			retry: 1,
		},
	},
});
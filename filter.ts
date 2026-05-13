export type Filter = ((id: string) => boolean) | RegExp;

export function testFilter(filter: Filter | null | undefined, id: string): boolean {
	if (!filter) return true;

	return typeof filter === "function" ? filter(id) : filter.test(id);
}

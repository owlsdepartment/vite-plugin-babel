export type Filter = ((id: string) => boolean) | RegExp;

export function testFilter(filter: Filter, id: string): boolean {
	return typeof filter === "function" ? filter(id) : filter.test(id);
}

import { TypedDocumentNode, useClientHandle } from '@urql/vue';
import { DocumentNode } from 'graphql';
import { onMounted, ref } from 'vue';

export function usePagedQuery<
  Result,
  Vars extends Record<string, any>,
  ListItem
>(
  query: string | TypedDocumentNode<Result, Vars> | DocumentNode,
  getList: (result: Result) => ListItem[],
  getCursor: (value: ListItem) => string,
  variables: Vars
) {
  //Fetch All Users
  const { client } = useClientHandle();
  const fetching = ref(true);
  const error = ref(false);
  const list = ref<any[]>([]);
  const currentPage = ref(0);
  const hasNextPage = ref(true);

  const fetchNextPage = async () => {
    fetching.value = true;
    try {
      const result = await client.query(query, {
        ...variables,
        cursor: list.value.length > 0
          ? getCursor(list.value.at(-1))
          : undefined
      }).toPromise();

      const resultList = getList(result.data!);

      if (resultList.length < 20) {
        hasNextPage.value = false
      }

      list.value.push(...resultList);
      currentPage.value++;
    } catch (e) {
      error.value = true;
    }
    fetching.value = false;
  }

  onMounted(async () => {
    await fetchNextPage()
  });

  const goToNextPage = async () => {
    if (hasNextPage.value) {
      await fetchNextPage()
    }
  };

  return {
    fetching,
    error,
    goToNextPage,
    list,
    hasNextPage,
  };
}

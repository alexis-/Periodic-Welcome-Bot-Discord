import { DateTime } from 'luxon';

import cst from '@/const';

export default {
  getElapsedTime: function() {
    return DateTime.local().diff(cst.initialMoment, 'hours').hours;
  },
  groupBy: <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>),
  asyncForEach: async function<T>(
    arr: T[],
    callback: (item: T, idx: number, arr: T[]) => Promise<void>)
  {
    for (let index = 0; index < arr.length; index++) {
      await callback(arr[index], index, arr);
    }
  }
};

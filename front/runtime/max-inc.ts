export function getMaxInc(arr: any[]) {
  // 后项 -> 前项
  const trainMap: Record<number, number> = {};

  let firstValid: number|null = null;
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item != null) {
      firstValid = i;
      break;
    }
  }

  if (firstValid == null) return [];

  // 维持每一项尽可能小的递增数组
  const lastItems = [arr[firstValid]];

  for (let i = firstValid + 1; i < arr.length; i++) {
    const value = arr[i];
    if (value == null) {
      continue;
    }

    const maxValue = lastItems[lastItems.length - 1];

    // 当前项比 记录的最大项值还大，直接放到末尾
    if (maxValue < value) {
      lastItems.push(value);
      // 后 -> 前
      trainMap[value] = maxValue;
      continue;
    }

    /*----------------- 找最后一个尾项小于目标值的候选者 -----------------*/
    let start = 0;
    let end = lastItems.length - 1;
    let lastSmallI: number|null = null; 
    while (start <= end) {
			const meet = start === end;
      const midI = (start + end) >> 1;
      const vMid = lastItems[midI];
      if (vMid < value) {
        // vLast < value，或者 vMid < value <= midI+1，即找打了最后一项小于目标值的数
        if (midI === lastItems.length - 1 || value <= lastItems[midI + 1]) {
          lastSmallI = midI;
          break;
        }
        start = midI + 1;
      } else {
        end = midI;
      }
			// meet 后最多再比较一次即可退出循环
			if(meet) {
				break;
			}
    }

    if (lastSmallI != null) {
      const lastSmall = lastItems[lastSmallI];
      // 将尾项数组 i+1 项替换为这个更小的值
      lastItems[lastSmallI + 1] = value;
      // 后 -> 前
      trainMap[value] = lastSmall;
    }
		// 找不到任何一项比其小的值，则第 0 项更新为一个更小的值
		else {
			lastItems[0] = value;
		}
  }

  // lastItems 最后就是 maxInc 的最后一项
  const len = lastItems.length;
  for (let i = len - 2; i >= 0; i--) {
    const item = trainMap[lastItems[i + 1]];
    lastItems[i] = item;
  }
  return lastItems;
}
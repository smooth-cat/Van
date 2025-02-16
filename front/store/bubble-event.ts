import { BaseEvent, EventMode } from '../../shared/message/event';
import { signal } from '../util/var';

export enum BubbleLevel {
	History,
	DetailCancelClear,
	Detail,
}

export const bubbleEvent = new BaseEvent({ mode: EventMode.Queue });
bubbleEvent.setScheduler(() => {
  const { type, args } = bubbleEvent.eventQueue.shift();
  const set = bubbleEvent.subMap.get(type);
  if (!set?.size) return;
  const arr = Array.from(set);
	arr.sort((a,b) => a['bubble'] - b['bubble']);
	const fn  = arr[0];
	fn(...args);
	if(fn['once']) {
		set.delete(fn);
	}
});

// signal.subAbort(() => bubbleEvent.clear());